package io.github.kitae9999.openlog.comment

import io.github.kitae9999.openlog.comment.dto.CommentResponse
import io.github.kitae9999.openlog.comment.entity.Comment
import io.github.kitae9999.openlog.common.resolveAuthorName
import org.springframework.stereotype.Component

@Component
class CommentMapper {
    fun toResponse(comment: Comment, userId: Long?): CommentResponse {
        val author = comment.user
        val authorId = requireNotNull(author.id)

        return CommentResponse(
            id = requireNotNull(comment.id),
            authorName = resolveAuthorName(author),
            authorProfileImageUrl = author.profileImageUrl,
            content = comment.content,
            createdAt = comment.createdAt.toString(),
            canManage = userId == authorId,
        )
    }
}
