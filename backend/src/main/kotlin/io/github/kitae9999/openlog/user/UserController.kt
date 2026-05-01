package io.github.kitae9999.openlog.user

import io.github.kitae9999.openlog.auth.CurrentUserResolver
import io.github.kitae9999.openlog.auth.exception.OAuthAuthenticationException
import io.github.kitae9999.openlog.post.dto.PostDetailResponse
import io.github.kitae9999.openlog.user.dto.PublicUserPostSummaryResponse
import io.github.kitae9999.openlog.user.dto.PublicUserProfileResponse
import io.github.kitae9999.openlog.user.dto.UpdateProfileRequest
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("users")
class UserController(
    private val userService: UserService,
    private val currentUserResolver: CurrentUserResolver,
) {
    @GetMapping("{username}")
    fun getPublicProfile(
        @PathVariable username: String,
        request: HttpServletRequest,
    ): PublicUserProfileResponse {
        return userService.getPublicProfile(username, resolveUserIdOrNull(request))
    }

    @GetMapping("{username}/posts")
    fun getPublicPosts(
        @PathVariable username: String,
    ): List<PublicUserPostSummaryResponse> {
        return userService.getPublicPosts(username)
    }

    @GetMapping("{username}/posts/{titleSlug}")
    fun getPublicPostDetail(
        @PathVariable username: String,
        @PathVariable titleSlug: String,
        request: HttpServletRequest,
    ): PostDetailResponse {
        return userService.getPublicPostDetail(username, titleSlug, resolveUserIdOrNull(request))
    }

    @PatchMapping("{username}")
    fun updateProfile(
        @PathVariable username: String,
        @Valid @RequestBody request: UpdateProfileRequest,
        httpRequest: HttpServletRequest,
    ): PublicUserProfileResponse {
        val currentUser = currentUserResolver.resolveCurrentUser(httpRequest)

        return userService.updateProfile(
            userId = requireNotNull(currentUser.id),
            username = username,
            nickname = request.nickname,
            bio = request.bio,
            location = request.location,
            websiteUrl = request.websiteUrl,
        )
    }

    private fun resolveUserIdOrNull(request: HttpServletRequest): Long? {
        return try {
            currentUserResolver.resolveUserIdFromJwt(request)
        } catch (e: OAuthAuthenticationException) {
            null
        }
    }
}
