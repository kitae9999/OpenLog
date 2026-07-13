package io.github.kitae9999.openlog.media.storage

import com.google.cloud.storage.BlobId
import com.google.cloud.storage.BlobInfo
import com.google.cloud.storage.HttpMethod
import com.google.cloud.storage.Storage
import com.google.cloud.storage.Storage.SignUrlOption
import io.github.kitae9999.openlog.media.config.StorageSignedUrlSigner
import io.github.kitae9999.openlog.media.exception.MediaStorageException
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.stereotype.Component
import java.time.Duration
import java.util.concurrent.TimeUnit

@Component
@ConditionalOnProperty(
    prefix = "media.storage",
    name = ["provider"],
    havingValue = "gcs",
    matchIfMissing = true,
)
class GcsMediaStorage(
    private val storage: Storage,
    private val storageSignedUrlSigner: StorageSignedUrlSigner,
) : MediaStorage {
    override fun createUpload(
        bucket: String,
        objectKey: String,
        contentType: String,
        expiration: Duration,
    ): MediaUpload {
        val blobInfo = BlobInfo.newBuilder(bucket, objectKey)
            .setContentType(contentType)
            .build()

        return try {
            val url = storage.signUrl(
                blobInfo,
                expiration.toMinutes(),
                TimeUnit.MINUTES,
                SignUrlOption.httpMethod(HttpMethod.PUT),
                SignUrlOption.withContentType(),
                SignUrlOption.withV4Signature(),
                storageSignedUrlSigner.signWithOption(),
            )
            MediaUpload(
                url = url.toString(),
                headers = mapOf("Content-Type" to contentType),
            )
        } catch (e: MediaStorageException) {
            throw e
        } catch (e: RuntimeException) {
            throw MediaStorageException(
                "이미지 업로드 URL을 생성할 수 없습니다. GCS credentials와 signed URL signer 설정을 확인해주세요.",
                e,
            )
        }
    }

    override fun createReadUrl(
        bucket: String,
        objectKey: String,
        expiration: Duration,
    ): String {
        val blobInfo = BlobInfo.newBuilder(bucket, objectKey).build()
        return try {
            storage.signUrl(
                blobInfo,
                expiration.toMinutes(),
                TimeUnit.MINUTES,
                SignUrlOption.httpMethod(HttpMethod.GET),
                SignUrlOption.withV4Signature(),
                storageSignedUrlSigner.signWithOption(),
            ).toString()
        } catch (e: MediaStorageException) {
            throw e
        } catch (e: RuntimeException) {
            throw MediaStorageException(
                "이미지 읽기 URL을 생성할 수 없습니다. GCS credentials와 signed URL signer 설정을 확인해주세요.",
                e,
            )
        }
    }

    override fun exists(bucket: String, objectKey: String): Boolean {
        return storage.get(BlobId.of(bucket, objectKey))?.exists() == true
    }

    override fun move(bucket: String, sourceObjectKey: String, targetObjectKey: String) {
        storage.copy(
            Storage.CopyRequest.newBuilder()
                .setSource(BlobId.of(bucket, sourceObjectKey))
                .setTarget(BlobId.of(bucket, targetObjectKey))
                .build()
        )
        storage.delete(BlobId.of(bucket, sourceObjectKey))
    }

    override fun delete(bucket: String, objectKey: String) {
        storage.delete(BlobId.of(bucket, objectKey))
    }
}
