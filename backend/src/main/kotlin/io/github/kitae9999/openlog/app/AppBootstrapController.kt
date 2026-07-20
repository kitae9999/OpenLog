package io.github.kitae9999.openlog.app

import io.github.kitae9999.openlog.user.entity.User
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/app")
class AppBootstrapController(
    private val appBootstrapService: AppBootstrapService,
) {
    @GetMapping("/bootstrap")
    fun getBootstrap(
        @AuthenticationPrincipal user: User,
        @RequestParam(required = false) workspaceId: Long?,
    ): AppBootstrapResponse {
        return appBootstrapService.getBootstrap(user, workspaceId)
    }
}
