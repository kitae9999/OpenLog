package io.github.kitae9999.openlog.user

import io.github.kitae9999.openlog.post.dto.PostDetailResponse
import io.github.kitae9999.openlog.post.entity.Post
import io.github.kitae9999.openlog.post.estimateReadTimeLabel
import io.github.kitae9999.openlog.post.formatPublishedAtLabel
import io.github.kitae9999.openlog.user.dto.PublicUserPostSummaryResponse
import io.github.kitae9999.openlog.user.dto.PublicUserProfileResponse
import io.github.kitae9999.openlog.user.dto.UpdateProfileRequest
import io.github.kitae9999.openlog.user.entity.User
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
) {
    @GetMapping("{username}")
    fun getPublicProfile(
        @PathVariable username: String,
    ): PublicUserProfileResponse {
        return userService.getPublicProfile(username).toPublicUserProfileResponse()
    }

    @GetMapping("{username}/posts")
    fun getPublicPosts(
        @PathVariable username: String,
    ): List<PublicUserPostSummaryResponse> {
        return userService.getPublicPosts(username)
            .map { it.toPublicUserPostSummaryResponse() }
    }

    @GetMapping("{username}/posts/{titleSlug}")
    fun getPublicPostDetail(
        @PathVariable username: String,
        @PathVariable titleSlug: String,
    ): PostDetailResponse {
        return userService.getPublicPostDetail(username, titleSlug).toPostDetailResponse()
    }

    @PatchMapping("{username}")
    fun updateProfile(
        @PathVariable username: String,
        @Valid @RequestBody request: UpdateProfileRequest,
    ): PublicUserProfileResponse {
        return userService.updateProfile(
            username = username,
            nickname = request.nickname,
            bio = request.bio,
            location = request.location,
            websiteUrl = request.websiteUrl,
        ).toPublicUserProfileResponse()
    }

    private fun User.toPublicUserProfileResponse(): PublicUserProfileResponse {
        return PublicUserProfileResponse(
            username = requireNotNull(username),
            nickname = nickname,
            profileImageUrl = profileImageUrl,
            bio = bio,
            location = location,
            websiteUrl = websiteUrl,
            joinedAt = createdAt.toString(),
        )
    }

    private fun Post.toPublicUserPostSummaryResponse(): PublicUserPostSummaryResponse {
        return PublicUserPostSummaryResponse(
            slug = slug,
            title = title,
            description = description,
            publishedAtLabel = formatPublishedAtLabel(this),
            readTimeLabel = estimateReadTimeLabel(this),
        )
    }

    private fun PublicPostDetail.toPostDetailResponse(): PostDetailResponse {
        return PostDetailResponse(
            id = requireNotNull(post.id),
            slug = post.slug,
            title = post.title,
            description = post.description,
            content = post.content,
            authorUsername = authorUsername,
            authorName = authorName,
            authorAvatarSrc = authorAvatarSrc,
            publishedAtLabel = formatPublishedAtLabel(post),
            readTimeLabel = estimateReadTimeLabel(post),
            topics = topics,
        )
    }
}
