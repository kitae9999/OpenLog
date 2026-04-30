package io.github.kitae9999.openlog.postlike

import io.github.kitae9999.openlog.auth.CurrentUserResolver
import jakarta.servlet.http.HttpServletRequest
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/posts/{postId}/like")
class PostLikeController(
    private val postLikeService: PostLikeService,
    private val currentUserResolver: CurrentUserResolver,
) {

    @PostMapping()
    fun toggleLike(
        @PathVariable postId: Long,
        request: HttpServletRequest
    ): Boolean {
        val currentUser = currentUserResolver.resolveCurrentUser(request)
        return postLikeService.toggleLike(currentUser, postId)
    }
}
