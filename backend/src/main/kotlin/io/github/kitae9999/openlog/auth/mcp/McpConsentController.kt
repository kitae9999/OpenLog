package io.github.kitae9999.openlog.auth.mcp

import io.github.kitae9999.openlog.user.entity.User
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.net.URI

@RestController
@RequestMapping("/oauth2/consent")
@ConditionalOnProperty(prefix = "auth.mcp", name = ["enabled"], havingValue = "true")
class McpConsentController(
    private val challengeService: McpOAuthChallengeService,
) {
    @GetMapping
    fun getChallenge(
        @AuthenticationPrincipal user: User,
        @RequestParam challenge: String,
    ): McpConsentChallengeResponse = challengeService
        .getAndBindChallenge(challenge, requireNotNull(user.id))

    @PostMapping
    fun decide(
        @AuthenticationPrincipal user: User,
        @RequestParam challenge: String,
        @RequestParam decision: String,
        @RequestParam(required = false) permissionProfile: String?,
    ): ResponseEntity<Void> {
        val redirect = challengeService.decide(
            challengeId = challenge,
            user = user,
            decision = decision,
            profileValue = permissionProfile,
        )
        return ResponseEntity.status(HttpStatus.SEE_OTHER)
            .header(HttpHeaders.LOCATION, URI.create(redirect).toASCIIString())
            .build()
    }
}
