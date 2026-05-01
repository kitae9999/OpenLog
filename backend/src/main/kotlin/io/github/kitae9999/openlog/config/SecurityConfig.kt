package io.github.kitae9999.openlog.config

import io.github.kitae9999.openlog.auth.GithubOAuthSuccessHandler
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.web.SecurityFilterChain

@Configuration
@EnableWebSecurity
class SecurityConfig (
    private val githubOAuthSuccessHandler: GithubOAuthSuccessHandler
){
    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain { // @EnableWebSecurity로 지정된 클래스안에서 등록된 SecurityFilterChain 타입의 빈을 Spring Security가 보안 필터 체인으로 사용함
        http
            .csrf { it.disable() }
            .sessionManagement {
                it.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
            }
            .authorizeHttpRequests {
                it
                    .requestMatchers( // 일단 모든 요청에 대해 인증여부 필터링걸어두지않음. todo: post생성, suggest생성같은 로그인 권한이 필요한 경로에 authenticated걸어두기
                        "/oauth2/**",
                        "/login/oauth2/**",
                        "/auth/google",
                        "/auth/google/callback",
                    ).permitAll()
                    .anyRequest().permitAll()

            }
            .oauth2Login {
                it.successHandler(githubOAuthSuccessHandler)
            }

        return http.build()
    }
}