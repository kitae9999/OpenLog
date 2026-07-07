package io.github.kitae9999.openlog.discussion

import io.github.kitae9999.openlog.common.resolveAuthorName
import io.github.kitae9999.openlog.discussion.dto.DiscussionResponse
import io.github.kitae9999.openlog.discussion.entity.Discussion
import org.springframework.stereotype.Component

@Component
class DiscussionMapper {
    fun toResponse(discussion: Discussion, currentUserId: Long?): DiscussionResponse {
        val author = discussion.user
        val authorId = requireNotNull(author.id)

        return DiscussionResponse(
            id = requireNotNull(discussion.id),
            authorName = resolveAuthorName(author),
            authorProfileImageUrl = author.profileImageUrl,
            content = discussion.content,
            createdAt = discussion.createdAt.toString(),
            canManage = currentUserId == authorId,
        )
    }
}
