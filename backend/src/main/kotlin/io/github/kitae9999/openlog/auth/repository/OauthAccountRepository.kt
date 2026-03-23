package io.github.kitae9999.openlog.auth.repository

import io.github.kitae9999.openlog.auth.entity.OauthAccount
import org.springframework.data.jpa.repository.JpaRepository

interface OauthAccountRepository: JpaRepository<OauthAccount, Long> {
    fun findByProviderAndProviderUserId(provider: String, providerUserId: String): OauthAccount
}