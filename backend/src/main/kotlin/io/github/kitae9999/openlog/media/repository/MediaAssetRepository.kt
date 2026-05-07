package io.github.kitae9999.openlog.media.repository

import io.github.kitae9999.openlog.media.entity.MediaAsset
import io.github.kitae9999.openlog.media.entity.MediaStatus
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import java.time.LocalDateTime
import java.util.UUID

interface MediaAssetRepository : JpaRepository<MediaAsset, Long> {
    fun findByPublicId(publicId: UUID): MediaAsset?
    fun findAllByPublicIdIn(publicIds: Collection<UUID>): List<MediaAsset>
    fun findAllByPostId(postId: Long): List<MediaAsset>
    fun findAllByPostIsNullAndStatusInAndCreatedAtBefore(
        statuses: Collection<MediaStatus>,
        createdAt: LocalDateTime,
        pageable: Pageable,
    ): List<MediaAsset>
}
