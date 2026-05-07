package io.github.kitae9999.openlog.media

import com.google.cloud.storage.BlobInfo
import com.google.cloud.storage.BlobId
import com.google.cloud.storage.HttpMethod
import com.google.cloud.storage.Storage
import com.google.cloud.storage.Storage.SignUrlOption
import io.github.kitae9999.openlog.common.exception.BadRequestException
import io.github.kitae9999.openlog.common.exception.ForbiddenException
import io.github.kitae9999.openlog.common.exception.NotFoundException
import io.github.kitae9999.openlog.media.config.StorageSignedUrlSigner
import io.github.kitae9999.openlog.media.command.CreateMediaUploadUrlCommand
import io.github.kitae9999.openlog.media.entity.MediaAsset
import io.github.kitae9999.openlog.media.entity.MediaPurpose
import io.github.kitae9999.openlog.media.entity.MediaStatus
import io.github.kitae9999.openlog.media.repository.MediaAssetRepository
import io.github.kitae9999.openlog.media.result.MediaUploadUrlResult
import io.github.kitae9999.openlog.post.entity.Post
import io.github.kitae9999.openlog.user.entity.User
import org.springframework.beans.factory.annotation.Value
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime
import java.util.UUID
import java.util.concurrent.TimeUnit

@Service
class MediaService(
    private val mediaAssetRepository: MediaAssetRepository,
    private val storage: Storage,
    private val storageSignedUrlSigner: StorageSignedUrlSigner,
    @Value("\${media.gcs.bucket-name:\${GCS_BUCKET_NAME:}}")
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
            storageSignedUrlSigner.signWithOption(),
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
            storageSignedUrlSigner.signWithOption(),
        ).toString()
    }

    @Transactional
    fun markUploadCompleted(assetId: Long, currentUser: User) {
        val mediaAsset = mediaAssetRepository.findById(assetId).orElseThrow {
            NotFoundException("이미지를 찾을 수 없습니다.")
        }

        if (mediaAsset.owner.id != currentUser.id) {
            throw ForbiddenException("이미지를 수정할 권한이 없습니다.")
        }

        val exists = storage.get(BlobId.of(mediaAsset.bucket, mediaAsset.objectKey))?.exists() == true
        if (!exists) {
            throw BadRequestException("업로드된 이미지 객체를 찾을 수 없습니다.")
        }

        mediaAsset.markUploaded()
    }

    @Transactional
    fun syncPostAssets(post: Post, content: String, ownerId: Long): Boolean {
        val postId = requireNotNull(post.id)
        val activeAssetIds = extractAssetIds(content)
        val attachedAssets = mediaAssetRepository.findAllByPostId(postId)
        val attachedAssetIds = attachedAssets.mapNotNull { it.id }.toSet()
        var changed = false

        if (activeAssetIds.isEmpty()) {
            return attachedAssets.isNotEmpty()
        }

        val assetsById = mediaAssetRepository.findAllByIdIn(activeAssetIds)
            .associateBy { requireNotNull(it.id) }

        for (assetId in activeAssetIds) {
            val mediaAsset = assetsById[assetId] ?: throw NotFoundException("이미지를 찾을 수 없습니다.")
            if (mediaAsset.owner.id != ownerId) {
                throw ForbiddenException("이미지를 사용할 권한이 없습니다.")
            }
            if (mediaAsset.status == MediaStatus.DELETED) {
                throw BadRequestException("삭제된 이미지는 사용할 수 없습니다.")
            }
            if (mediaAsset.post != null && mediaAsset.post?.id != postId) {
                throw BadRequestException("다른 글에 연결된 이미지는 사용할 수 없습니다.")
            }

            val nextObjectKey = buildAttachedObjectKey(mediaAsset, postId)
            if (mediaAsset.objectKey != nextObjectKey) {
                storage.copy(
                    Storage.CopyRequest.newBuilder()
                        .setSource(BlobId.of(mediaAsset.bucket, mediaAsset.objectKey))
                        .setTarget(BlobId.of(mediaAsset.bucket, nextObjectKey))
                        .build()
                )
                storage.delete(BlobId.of(mediaAsset.bucket, mediaAsset.objectKey))
            }

            if (mediaAsset.post?.id != postId || mediaAsset.status != MediaStatus.ATTACHED || mediaAsset.objectKey != nextObjectKey) {
                mediaAsset.attachTo(post, nextObjectKey)
                changed = true
            }
        }

        return changed || activeAssetIds != attachedAssetIds
    }

    @Transactional
    fun cleanupOrphanAssets(): Int {
        val expiredBefore = LocalDateTime.now().minusHours(24)
        val targets = mediaAssetRepository.findAllByPostIsNullAndStatusInAndCreatedAtBefore(
            statuses = listOf(MediaStatus.PENDING, MediaStatus.UPLOADED),
            createdAt = expiredBefore,
            pageable = PageRequest.of(0, CLEANUP_BATCH_SIZE),
        )

        for (mediaAsset in targets) {
            storage.delete(BlobId.of(mediaAsset.bucket, mediaAsset.objectKey))
            mediaAsset.markDeleted()
        }

        return targets.size
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

    private fun buildAttachedObjectKey(mediaAsset: MediaAsset, postId: Long): String {
        if (!mediaAsset.objectKey.startsWith("post-assets/tmp/")) {
            return mediaAsset.objectKey
        }

        val fileName = mediaAsset.objectKey.substringAfterLast("/")
        return when (mediaAsset.purpose) {
            MediaPurpose.POST_BODY_IMAGE -> "post-assets/posts/$postId/images/$fileName"
            MediaPurpose.POST_COVER_IMAGE -> "post-assets/posts/$postId/cover/$fileName"
            MediaPurpose.PROFILE_IMAGE -> mediaAsset.objectKey
        }
    }

    private fun extractAssetIds(content: String): Set<Long> {
        return ASSET_URL_PATTERN.findAll(content)
            .mapNotNull { match -> match.groupValues[1].toLongOrNull() }
            .toSet()
    }

    companion object {
        private const val CLEANUP_BATCH_SIZE = 100
        private val ASSET_URL_PATTERN = Regex("""/api/media/assets/(\d+)""")
    }
}
