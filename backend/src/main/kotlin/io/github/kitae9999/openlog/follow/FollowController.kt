package io.github.kitae9999.openlog.follow

import io.github.kitae9999.openlog.follow.dto.FollowUserResponse
import io.github.kitae9999.openlog.user.entity.User
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/users/{username}")
class FollowController(
    private val followService: FollowService,
) {
    @PostMapping("/follow")
    fun followUser(
        @AuthenticationPrincipal user: User,
        @PathVariable("username") targetUsername: String,
    ): ResponseEntity<Void> {
        followService.followUser(
            currentUser = user,
            targetUsername = targetUsername,
        )
        return ResponseEntity.noContent().build()
    }

    @DeleteMapping("/follow")
    fun unfollowUser(
        @AuthenticationPrincipal user: User,
        @PathVariable("username") targetUsername: String,
    ): ResponseEntity<Void> {
        followService.unfollowUser(
            currentUser = user,
            targetUsername = targetUsername,
        )
        return ResponseEntity.noContent().build()
    }

    @GetMapping("/following")
    fun getFollowing(
        @PathVariable username: String,
    ): List<FollowUserResponse> {
        return followService.getFollowing(username)
    }

    @GetMapping("/followers")
    fun getFollowers(
        @PathVariable username: String,
    ): List<FollowUserResponse> {
        return followService.getFollowers(username)
    }
}
