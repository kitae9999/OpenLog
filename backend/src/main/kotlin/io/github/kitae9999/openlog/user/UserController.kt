package io.github.kitae9999.openlog.user

import io.github.kitae9999.openlog.post.dto.PostDetailResponse
import io.github.kitae9999.openlog.post.dto.RecentPostCursorResponse
import io.github.kitae9999.openlog.user.dto.PublicUserPostGraphResponse
import io.github.kitae9999.openlog.user.dto.PublicUserPostSummaryResponse
import io.github.kitae9999.openlog.user.dto.PublicUserProfileResponse
import io.github.kitae9999.openlog.user.dto.UpdateProfileRequest
import io.github.kitae9999.openlog.user.entity.User
import jakarta.validation.Valid
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/users")
class UserController(
    private val userService: UserService,
) {
    @GetMapping("/me/posts")
    fun getAuthoredPosts(
        @AuthenticationPrincipal user: User,
        @RequestParam(required = false) cursor: String?,
        @RequestParam(defaultValue = "10") size: Int,
    ): RecentPostCursorResponse {
        return userService.getAuthoredPosts(requireNotNull(user.id), cursor, size)
    }

    @GetMapping("/me/following/posts")
    fun getFollowingPosts(
        @AuthenticationPrincipal user: User,
        @RequestParam(required = false) cursor: String?,
        @RequestParam(defaultValue = "10") size: Int,
    ): RecentPostCursorResponse {
        return userService.getFollowingPosts(requireNotNull(user.id), cursor, size)
    }

    @GetMapping("/me/liked-posts")
    fun getLikedPosts(
        @AuthenticationPrincipal user: User,
        @RequestParam(required = false) cursor: String?,
        @RequestParam(defaultValue = "10") size: Int,
    ): RecentPostCursorResponse {
        return userService.getLikedPosts(requireNotNull(user.id), cursor, size)
    }

    @GetMapping("/{username}")
    fun getPublicProfile(
        @PathVariable username: String,
        @AuthenticationPrincipal user: User?,
    ): PublicUserProfileResponse {
        return userService.getPublicProfile(username, user?.id)
    }

    @GetMapping("/{username}/posts")
    fun getPublicPosts(
        @PathVariable username: String,
    ): List<PublicUserPostSummaryResponse> {
        return userService.getPublicPosts(username)
    }

    @GetMapping("/{username}/post-graph")
    fun getPublicPostGraph(
        @PathVariable username: String,
    ): PublicUserPostGraphResponse {
        return userService.getPublicPostGraph(username)
    }

    @GetMapping("/{username}/posts/{titleSlug}")
    fun getPublicPostDetail(
        @PathVariable username: String,
        @PathVariable titleSlug: String,
        @AuthenticationPrincipal user: User?,
    ): PostDetailResponse {
        return userService.getPublicPostDetail(username, titleSlug, user?.id)
    }

    @PatchMapping("/{username}")
    fun updateProfile(
        @AuthenticationPrincipal user: User,
        @PathVariable username: String,
        @Valid @RequestBody request: UpdateProfileRequest,
    ): PublicUserProfileResponse {
        return userService.updateProfile(
            userId = requireNotNull(user.id),
            username = username,
            nickname = request.nickname,
            bio = request.bio,
            location = request.location,
            websiteUrl = request.websiteUrl,
        )
    }
}
