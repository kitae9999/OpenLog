package io.github.kitae9999.openlog.media.dto

import java.util.UUID

data class CreateMediaUploadUrlResponse(
    val assetId: UUID,
    val uploadUrl: String,
    val markdownUrl: String,
    val headers: Map<String, String>,
)
