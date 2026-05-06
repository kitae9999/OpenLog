package io.github.kitae9999.openlog.media

import com.google.cloud.storage.BlobInfo
import com.google.cloud.storage.HttpMethod
import com.google.cloud.storage.Storage
import com.google.cloud.storage.Storage.SignUrlOption
import io.github.kitae9999.openlog.common.exception.BadRequestException
import io.github.kitae9999.openlog.common.exception.ForbiddenException
import io.github.kitae9999.openlog.common.exception.NotFoundException
import io.github.kitae9999.openlog.media.command.CreateMediaUploadUrlCommand
import io.github.kitae9999.openlog.media.entity.MediaAsset
import io.github.kitae9999.openlog.media.entity.MediaPurpose
import io.github.kitae9999.openlog.media.entity.MediaStatus
import io.github.kitae9999.openlog.media.repository.MediaAssetRepository
import io.github.kitae9999.openlog.media.result.MediaUploadUrlResult
import io.github.kitae9999.openlog.user.entity.User
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID
import java.util.concurrent.TimeUnit

@Service
class MediaService(
    private val mediaAssetRepository: MediaAssetRepository,
    private val storage: Storage,
    @Value("\${media.gcs.bucket-name:}")
    private val bucketName: String,
    @Value("\${media.signed-url.upload-expiration-minutes:15}")
    private val uploadExpirationMinutes: Long,
    @Value("\${media.signed-url.read-expiration-minutes:15}")
    private val readExpirationMinutes: Long,
) {
    @Transactional
    fun createUploadUrl(
        currentUser: User,
        command: CreateMediaUploadUrlCommand,
    ): MediaUploadUrlResult {
        val ownerId = requireNotNull(currentUser.id)
        val purpose = parsePurpose(command.purpose)
        validateUploadCommand(command, purpose)
        val bucket = configuredBucketName()
        val objectKey = buildObjectKey(purpose, ownerId)
        val mediaAsset = mediaAssetRepository.save(
            MediaAsset(
                owner = currentUser,
                purpose = purpose,
                bucket = bucket,
                objectKey = objectKey,
                contentType = command.contentType,
                sizeBytes = command.sizeBytes,
            )
        )
        val assetId = requireNotNull(mediaAsset.id)

        val blobInfo = BlobInfo.newBuilder(bucket, objectKey)
            .setContentType(command.contentType)
            .build()
        val uploadUrl = storage.signUrl(
            blobInfo,
            uploadExpirationMinutes,
            TimeUnit.MINUTES,
            SignUrlOption.httpMethod(HttpMethod.PUT),
            SignUrlOption.withContentType(),
            SignUrlOption.withV4Signature(),
        )

        return MediaUploadUrlResult(
            assetId = assetId,
            uploadUrl = uploadUrl.toString(),
            headers = mapOf("Content-Type" to command.contentType),
        )
    }

    @Transactional(readOnly = true)
    fun createReadUrl(assetId: Long, viewerUserId: Long?): String {
        val mediaAsset = mediaAssetRepository.findById(assetId).orElseThrow {
            NotFoundException("이미지를 찾을 수 없습니다.")
        }

        if (mediaAsset.status == MediaStatus.DELETED) {
            throw NotFoundException("이미지를 찾을 수 없습니다.")
        }

        if (mediaAsset.post == null && mediaAsset.owner.id != viewerUserId) {
            throw ForbiddenException("이미지에 접근할 권한이 없습니다.")
        }

        val blobInfo = BlobInfo.newBuilder(mediaAsset.bucket, mediaAsset.objectKey).build()
        return storage.signUrl(
            blobInfo,
            readExpirationMinutes,
            TimeUnit.MINUTES,
            SignUrlOption.httpMethod(HttpMethod.GET),
            SignUrlOption.withV4Signature(),
        ).toString()
    }

    private fun configuredBucketName(): String {
        val bucket = bucketName.trim()
        if (bucket.isBlank()) {
            throw BadRequestException("GCS bucket name is not configured.")
        }

        return bucket
    }

    private fun parsePurpose(rawPurpose: String): MediaPurpose {
        return runCatching { MediaPurpose.valueOf(rawPurpose.trim().uppercase()) }
            .getOrElse { throw BadRequestException("지원하지 않는 이미지 용도입니다.") }
    }

    private fun validateUploadCommand(
        command: CreateMediaUploadUrlCommand,
        purpose: MediaPurpose,
    ) {
        if (command.contentType != "image/webp") {
            throw BadRequestException("이미지는 WebP 형식으로 업로드해야 합니다.")
        }

        if (purpose != MediaPurpose.POST_BODY_IMAGE && purpose != MediaPurpose.PROFILE_IMAGE) {
            throw BadRequestException("아직 지원하지 않는 이미지 용도입니다.")
        }
    }

    private fun buildObjectKey(purpose: MediaPurpose, userId: Long): String {
        val fileId = UUID.randomUUID()

        return when (purpose) {
            MediaPurpose.PROFILE_IMAGE -> "profile-images/users/$userId/$fileId.webp"
            MediaPurpose.POST_BODY_IMAGE -> "post-assets/tmp/users/$userId/$fileId.webp"
            MediaPurpose.POST_COVER_IMAGE -> "post-assets/tmp/users/$userId/covers/$fileId.webp"
        }
    }
}
