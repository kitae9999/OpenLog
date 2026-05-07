package io.github.kitae9999.openlog.media.result

import java.util.UUID

data class MediaUploadUrlResult(
    val assetId: UUID,
    val uploadUrl: String,
    val headers: Map<String, String>,
)
