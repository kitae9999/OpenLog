package io.github.kitae9999.openlog.auth

import io.github.kitae9999.openlog.auth.exception.OAuthAuthenticationException
import io.github.kitae9999.openlog.common.exception.NotFoundException
import io.github.kitae9999.openlog.user.entity.User
import io.github.kitae9999.openlog.user.repository.UserRepository
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.beans.factory.annotation.Value
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter
import kotlin.jvm.optionals.getOrNull


@Component
class JwtAuthenticationFilter(
    private val jwtTokenService: JwtTokenService,
    private val userRepository: UserRepository,
    @Value("\${auth.jwt.cookie-name:openlog_access_token}")
    private val accessTokenCookieName: String,
): OncePerRequestFilter() { // kotlin 상속은 부모생성자 호출 명시성, OncePerRequestFilter를 상속받으면 해당 필터는 요청당 한번만 거치게된다.

    override fun doFilterInternal( // doFilter는 부모 클래스인 OncePerRequestFilter, 비즈니스 로직은 상속받은 자식클래스에서 doFilterInternal
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        val token = request.cookies
            ?.firstOrNull { it.name == accessTokenCookieName } // 쿠키의 이름이 accessTokenCookieName인 첫번째 요소 반환 없으면 null
            ?.value // Cookie 객체 안 실제 값

        if (token != null ){
            runCatching { // parseUserId에서 예외를 던져도 그냥 진행
                val userId = jwtTokenService.parseUserId(token)
                val user = userRepository.findById(userId).getOrNull() // 여기서 ?: throw 예외처리하면 로그인안한 사용자는 모두 예외처리나버림

                if (user != null) {
                    val auth = UsernamePasswordAuthenticationToken(user, null, emptyList()) // Authentication 객체 생성
                    SecurityContextHolder.getContext().authentication = auth // Spring Security가 인증 상태를 저장하는 보관소에서 현재 이 요청의 SecurityContext를 꺼내서 그 안의 인증정보에 auth를 저장
                }
            }
        }

        filterChain.doFilter(request, response)
    }
}