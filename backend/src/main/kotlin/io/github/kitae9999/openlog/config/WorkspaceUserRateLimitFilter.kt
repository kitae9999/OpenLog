package io.github.kitae9999.openlog.config

import io.github.kitae9999.openlog.common.exception.ErrorResponse
import io.github.kitae9999.openlog.user.entity.User
import io.micrometer.core.instrument.MeterRegistry
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.data.redis.RedisConnectionFailureException
import org.springframework.data.redis.core.StringRedisTemplate
import org.springframework.data.redis.core.script.DefaultRedisScript
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter
import tools.jackson.databind.ObjectMapper
import java.util.UUID

@Component
class WorkspaceUserRateLimiter(
    private val redisTemplate: StringRedisTemplate,
) {
    fun tryAcquire(userId: Long): Boolean {
        val now = System.currentTimeMillis()
        val result = redisTemplate.execute(
            RATE_LIMIT_SCRIPT,
            listOf("rate-limit:workspace:user:$userId"),
            now.toString(),
            WINDOW_MILLIS.toString(),
            REQUEST_LIMIT.toString(),
            "$now:${UUID.randomUUID()}",
        )
        return result == 1L
    }

    private companion object {
        private const val WINDOW_MILLIS = 3_000L
        private const val REQUEST_LIMIT = 30L
        private val RATE_LIMIT_SCRIPT = DefaultRedisScript(
            """
            local key = KEYS[1]
            local now = tonumber(ARGV[1])
            local window = tonumber(ARGV[2])
            local requestLimit = tonumber(ARGV[3])
            local member = ARGV[4]
            redis.call('ZREMRANGEBYSCORE', key, '-inf', now - window)
            local requestCount = redis.call('ZCARD', key)
            if requestCount >= requestLimit then
                return 0
            end
            redis.call('ZADD', key, now, member)
            redis.call('PEXPIRE', key, window)
            return 1
            """.trimIndent(),
            Long::class.java,
        )
    }
}

@Component
class WorkspaceUserRateLimitFilter(
    private val rateLimiter: WorkspaceUserRateLimiter,
    private val objectMapper: ObjectMapper,
    private val meterRegistry: MeterRegistry,
    @Value("\${openlog.rate-limit.workspace.enabled:false}")
    private val enabled: Boolean,
) : OncePerRequestFilter() {
    override fun shouldNotFilter(request: HttpServletRequest): Boolean {
        if (!enabled) {
            return true
        }
        val path = request.servletPath
        val workspacePath = path == "/workspaces" ||
            path.startsWith("/workspaces/") ||
            path.startsWith("/workspace-projects/")
        return !workspacePath || path.matches(WORKSPACE_EVENTS_PATH)
    }

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain,
    ) {
        val user = SecurityContextHolder.getContext().authentication?.principal as? User
        val userId = user?.id
        if (userId == null) {
            filterChain.doFilter(request, response)
            return
        }

        val allowed = try {
            rateLimiter.tryAcquire(userId)
        } catch (error: RedisConnectionFailureException) {
            LOG.warn("Workspace user rate limiter unavailable; allowing request", error)
            meterRegistry.counter(METRIC_NAME, "result", "fail_open").increment()
            true
        }

        if (allowed) {
            meterRegistry.counter(METRIC_NAME, "result", "allowed").increment()
            filterChain.doFilter(request, response)
            return
        }

        meterRegistry.counter(METRIC_NAME, "result", "rejected").increment()
        response.status = HttpStatus.TOO_MANY_REQUESTS.value()
        response.contentType = MediaType.APPLICATION_JSON_VALUE
        response.characterEncoding = Charsets.UTF_8.name()
        response.setHeader("Retry-After", "1")
        objectMapper.writeValue(
            response.outputStream,
            ErrorResponse(
                code = "RATE_LIMITED",
                message = "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
            ),
        )
    }

    private companion object {
        private val LOG = LoggerFactory.getLogger(WorkspaceUserRateLimitFilter::class.java)
        private val WORKSPACE_EVENTS_PATH = Regex("^/workspaces/\\d+/events$")
        private const val METRIC_NAME = "openlog.workspace.rate_limit.requests"
    }
}
