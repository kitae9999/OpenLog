package io.github.kitae9999.openlog.media.storage

import java.time.Duration

interface MediaStorage {
    fun createUpload(
        bucket: String,
        objectKey: String,
        contentType: String,
        expiration: Duration,
    ): MediaUpload

    fun createReadUrl(
        bucket: String,
        objectKey: String,
        expiration: Duration,
    ): String

    fun exists(bucket: String, objectKey: String): Boolean

    fun move(bucket: String, sourceObjectKey: String, targetObjectKey: String)

    fun delete(bucket: String, objectKey: String)
}

data class MediaUpload(
    val url: String,
    val headers: Map<String, String>,
)
