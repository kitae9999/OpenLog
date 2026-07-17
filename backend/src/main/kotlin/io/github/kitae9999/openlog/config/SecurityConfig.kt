package io.github.kitae9999.openlog.config

import io.github.kitae9999.openlog.auth.GithubOAuthSuccessHandler
import io.github.kitae9999.openlog.auth.JwtAuthenticationFilter
import io.github.kitae9999.openlog.auth.mcp.McpInternalAuthenticationConverter
import io.github.kitae9999.openlog.auth.mcp.McpInternalTokenIntrospector
import io.github.kitae9999.openlog.auth.mcp.McpOAuthProperties
import io.github.kitae9999.openlog.common.exception.ErrorResponse
import io.github.kitae9999.openlog.user.repository.UserRepository
import jakarta.servlet.http.HttpServletResponse
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.HttpMethod
import org.springframework.http.MediaType
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter
import tools.jackson.databind.ObjectMapper

@Configuration
@EnableWebSecurity
class SecurityConfig(
    private val githubOAuthSuccessHandler: GithubOAuthSuccessHandler,
    private val jwtAuthenticationFilter: JwtAuthenticationFilter,
    private val objectMapper: ObjectMapper,
    private val mcpOAuthProperties: org.springframework.beans.factory.ObjectProvider<McpOAuthProperties>,
    private val mcpInternalTokenIntrospector: org.springframework.beans.factory.ObjectProvider<McpInternalTokenIntrospector>,
    private val userRepository: UserRepository,
) {
    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
        http
            .csrf { it.disable() }
            .sessionManagement {
                it.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
            }
            .authorizeHttpRequests {
                it
                    // OAuth / 로그인
                    .requestMatchers(
                        "/oauth2/authorization/**",
                        "/login/oauth2/**",
                        "/auth/google",
                        "/auth/google/callback",
                        "/auth/github",
                    ).permitAll()
                    .requestMatchers("/oauth2/consent", "/auth/mcp/connections/**").authenticated()
                    // auth — 로그아웃/디바이스 로그인 시작·토큰 교환 공개
                    .requestMatchers(
                        HttpMethod.POST,
                        "/auth/logout",
                        "/auth/device/start",
                        "/auth/device/token",
                        "/auth/device/refresh",
                        "/auth/device/revoke",
                        "/auth/web/refresh",
                    ).permitAll()
                    // auth — 내 정보/온보딩/디바이스 승인 인증 필요
                    .requestMatchers(
                        HttpMethod.GET,
                        "/auth/me",
                    ).authenticated()
                    .requestMatchers(
                        HttpMethod.POST,
                        "/auth/onboarding",
                        "/auth/device/approve",
                    ).authenticated()

                    // posts — GET 공개, 생성/수정/삭제 인증 필요
                    .requestMatchers(HttpMethod.GET, "/posts").permitAll()
                    .requestMatchers(HttpMethod.GET, "/posts/*").authenticated()
                    .requestMatchers(HttpMethod.GET, "/posts/*/comments").permitAll()
                    .requestMatchers(HttpMethod.GET, "/posts/*/suggestions").permitAll()
                    .requestMatchers(HttpMethod.GET, "/posts/*/suggestions/*").permitAll()
                    .requestMatchers(HttpMethod.POST, "/posts").authenticated()
                    .requestMatchers(HttpMethod.POST, "/posts/**").authenticated()
                    .requestMatchers(HttpMethod.PUT, "/posts/**").authenticated()
                    .requestMatchers(HttpMethod.PATCH, "/posts/**").authenticated()
                    .requestMatchers(HttpMethod.DELETE, "/posts/**").authenticated()

                    // users — me/* 인증 필요, 프로필 조회 공개, 팔로우 변경 인증 필요
                    .requestMatchers(HttpMethod.GET, "/users/me/**").authenticated()
                    .requestMatchers(HttpMethod.PATCH, "/users/**").authenticated()
                    .requestMatchers(HttpMethod.POST, "/users/*/follow").authenticated()
                    .requestMatchers(HttpMethod.DELETE, "/users/*/follow").authenticated()
                    .requestMatchers(HttpMethod.GET, "/users/*/following").permitAll()
                    .requestMatchers(HttpMethod.GET, "/users/*/followers").permitAll()
                    .requestMatchers(HttpMethod.GET, "/users/*/post-graph").permitAll()
                    .requestMatchers(HttpMethod.GET, "/users/*/posts/**").permitAll()
                    .requestMatchers(HttpMethod.GET, "/users/*").permitAll()

                    // notifications — 전부 인증 필요
                    .requestMatchers("/notifications/**").authenticated()

                    // media — 조회 공개(컨트롤러에서 optional auth), 업로드/완료 처리 인증 필요
                    .requestMatchers(HttpMethod.GET, "/media/assets/*").permitAll()
                    .requestMatchers(HttpMethod.POST, "/media/upload-url").authenticated()
                    .requestMatchers(HttpMethod.PATCH, "/media/assets/*/completion").authenticated()

                    // workspace — logs/tasks 전부 인증 필요 (owner 검사는 WorkspaceAccessResolver)
                    .requestMatchers("/workspaces", "/workspaces/**").authenticated()
                    .requestMatchers("/workspace-projects/**").authenticated()
                    .requestMatchers("/*/logs", "/*/logs/**").authenticated()
                    .requestMatchers("/*/tasks", "/*/tasks/**").authenticated()

                    // 위 규칙에 없는 경로는 공개 (optional auth는 컨트롤러에서 처리)
                    .anyRequest().permitAll()
            }
            .exceptionHandling {
                // authenticated() URL에 principal 없이 접근하면 기본 동작은 oauth2Login redirect(302)다.
                // API·SSR fetch는 401 JSON을 기대하므로 GlobalExceptionHandler와 같은 ErrorResponse 형식으로 응답한다.
                it.authenticationEntryPoint { _, response, _ ->
                    response.status = HttpServletResponse.SC_UNAUTHORIZED
                    response.contentType = MediaType.APPLICATION_JSON_VALUE
                    response.characterEncoding = Charsets.UTF_8.name()
                    objectMapper.writeValue(
                        response.outputStream,
                        ErrorResponse(
                            code = "UNAUTHORIZED",
                            message = "로그인이 필요합니다.",
                        ),
                    )
                }
                // 로그인은 됐으나 권한이 부족한 경우(hasRole 등) 403 JSON을 반환한다.
                it.accessDeniedHandler { _, response, _ ->
                    response.status = HttpServletResponse.SC_FORBIDDEN
                    response.contentType = MediaType.APPLICATION_JSON_VALUE
                    response.characterEncoding = Charsets.UTF_8.name()
                    objectMapper.writeValue(
                        response.outputStream,
                        ErrorResponse(
                            code = "FORBIDDEN",
                            message = "권한이 없습니다.",
                        ),
                    )
                }
            }
            .oauth2Login {
                it.successHandler(githubOAuthSuccessHandler)
            }
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter::class.java)

        if (mcpOAuthProperties.ifAvailable?.enabled == true) {
            val introspector = mcpInternalTokenIntrospector.getIfAvailable()
            if (introspector != null) {
                http.oauth2ResourceServer { resourceServer ->
                    resourceServer.opaqueToken { opaqueToken ->
                        opaqueToken
                            .introspector(introspector)
                            .authenticationConverter(McpInternalAuthenticationConverter(userRepository))
                    }
                }
            }
        }

        return http.build()
    }
}
