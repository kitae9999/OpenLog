package io.github.kitae9999.openlog.suggest.dto

import io.github.kitae9999.openlog.suggest.entity.SuggestionStatus
import java.time.LocalDateTime

data class SuggestionSummaryResponse(
    val id: Long,
    val title: String,
    val status: SuggestionStatus,
    val authorName: String,
    val authorProfileImageUrl: String?,
    val createdAt: LocalDateTime,
    val commentCount: Int = 0,
)
