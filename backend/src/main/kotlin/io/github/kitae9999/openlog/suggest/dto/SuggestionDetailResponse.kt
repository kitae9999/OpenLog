package io.github.kitae9999.openlog.suggest.dto

import io.github.kitae9999.openlog.discussion.dto.DiscussionResponse
import io.github.kitae9999.openlog.suggest.entity.SuggestionStatus
import java.time.LocalDateTime

data class SuggestionDetailResponse(
    val id: Long,
    val title: String,
    val content: String,
    val baseContent: String,
    val description: String,
    val status: SuggestionStatus,
    val authorId: Long,
    val authorName: String,
    val authorProfileImageUrl: String?,
    val createdAt: LocalDateTime,
    val postBaseVersion: Long,
    val discussions: List<DiscussionResponse>,
)
