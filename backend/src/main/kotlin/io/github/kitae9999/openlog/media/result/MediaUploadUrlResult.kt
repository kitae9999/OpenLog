package io.github.kitae9999.openlog.media.result

data class MediaUploadUrlResult(
    val assetId: Long,
    val uploadUrl: String,
    val headers: Map<String, String>,
)
