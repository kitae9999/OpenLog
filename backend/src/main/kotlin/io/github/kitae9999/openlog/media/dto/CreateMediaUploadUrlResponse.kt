package io.github.kitae9999.openlog.media.dto

data class CreateMediaUploadUrlResponse(
    val assetId: Long,
    val uploadUrl: String,
    val markdownUrl: String,
    val headers: Map<String, String>,
)
