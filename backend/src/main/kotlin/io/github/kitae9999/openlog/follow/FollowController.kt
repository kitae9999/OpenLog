package io.github.kitae9999.openlog.follow

import io.github.kitae9999.openlog.auth.CurrentUserResolver
import jakarta.servlet.http.HttpServletRequest
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("users/{username}/follow")
class FollowController(
    private val followService: FollowService,
    private val currentUserResolver: CurrentUserResolver
) {
    @PostMapping
    fun followUser(
        @PathVariable("username") targetUsername : String,
        request: HttpServletRequest
    ): ResponseEntity<Void> {
        val currentUser = currentUserResolver.resolveCurrentUser(request)
        followService.followUser(
            currentUser = currentUser,
            targetUsername = targetUsername
        )
        return ResponseEntity.noContent().build()
    }

    @DeleteMapping
    fun unfollowUser(
        @PathVariable("username") targetUsername : String,
        request: HttpServletRequest
    ): ResponseEntity<Void> {
        val currentUser = currentUserResolver.resolveCurrentUser(request)
        followService.unfollowUser(
            currentUser = currentUser,
            targetUsername = targetUsername
        )
        return ResponseEntity.noContent().build()
    }
}
