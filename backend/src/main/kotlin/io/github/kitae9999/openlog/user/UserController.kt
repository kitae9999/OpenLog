package io.github.kitae9999.openlog.user

import io.github.kitae9999.openlog.post.dto.PostDetailResponse
import io.github.kitae9999.openlog.user.dto.PublicUserPostSummaryResponse
import io.github.kitae9999.openlog.user.dto.PublicUserProfileResponse
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
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
        return userService.getPublicProfile(username)
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
    ): PostDetailResponse {
        return userService.getPublicPostDetail(username, titleSlug)
    }

//    @PatchMapping("{username}")
//    fun updateProfile(
//        @PathVariable username: String,
//    ){
//
//    }
}
