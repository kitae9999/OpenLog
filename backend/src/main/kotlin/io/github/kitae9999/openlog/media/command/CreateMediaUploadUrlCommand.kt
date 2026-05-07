package io.github.kitae9999.openlog.media.command

data class CreateMediaUploadUrlCommand(
    val fileName: String,
    val originalFileName: String?,
    val contentType: String,
    val sizeBytes: Long,
    val purpose: String,
)
