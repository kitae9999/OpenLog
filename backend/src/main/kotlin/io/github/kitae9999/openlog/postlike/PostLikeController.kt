package io.github.kitae9999.openlog.postlike

import io.github.kitae9999.openlog.user.entity.User
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/posts/{postId}/like")
class PostLikeController(
    private val postLikeService: PostLikeService,
) {
    @PostMapping
    fun toggleLike(
        @AuthenticationPrincipal user: User,
        @PathVariable postId: Long,
    ): Boolean {
        return postLikeService.toggleLike(user, postId)
    }
}
