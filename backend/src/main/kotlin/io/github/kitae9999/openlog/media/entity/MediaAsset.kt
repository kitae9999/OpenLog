package io.github.kitae9999.openlog.media.entity

import io.github.kitae9999.openlog.post.entity.Post
import io.github.kitae9999.openlog.user.entity.User
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import java.time.LocalDateTime
import java.util.UUID

@Entity
@Table(name = "media_assets")
class MediaAsset(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,
    publicId: UUID = UUID.randomUUID(),
    owner: User,
    purpose: MediaPurpose,
    bucket: String,
    objectKey: String,
    contentType: String,
    sizeBytes: Long,
    status: MediaStatus = MediaStatus.PENDING,
) {
    @Column(name = "public_id", nullable = false, unique = true)
    val publicId: UUID = publicId

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_user_id", nullable = false)
    var owner: User = owner
        protected set

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id")
    var post: Post? = null
        protected set

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var purpose: MediaPurpose = purpose
        protected set

    @Column(nullable = false)
    var bucket: String = bucket
        protected set

    @Column(name = "object_key", nullable = false, unique = true, length = 1024)
    var objectKey: String = objectKey
        protected set

    @Column(name = "content_type", nullable = false, length = 100)
    var contentType: String = contentType
        protected set

    @Column(name = "size_bytes", nullable = false)
    var sizeBytes: Long = sizeBytes
        protected set

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var status: MediaStatus = status
        protected set

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now()
        protected set

    @Column(name = "uploaded_at")
    var uploadedAt: LocalDateTime? = null
        protected set

    @Column(name = "attached_at")
    var attachedAt: LocalDateTime? = null
        protected set

    @Column(name = "deleted_at")
    var deletedAt: LocalDateTime? = null
        protected set

    fun markUploaded() {
        if (status == MediaStatus.DELETED) {
            return
        }

        status = MediaStatus.UPLOADED
        uploadedAt = LocalDateTime.now()
    }

    fun attachTo(post: Post, nextObjectKey: String) {
        this.post = post
        this.objectKey = nextObjectKey
        status = MediaStatus.ATTACHED
        attachedAt = LocalDateTime.now()
    }

    fun attachToProfile() {
        status = MediaStatus.ATTACHED
        attachedAt = LocalDateTime.now()
    }

    fun markDeleted() {
        status = MediaStatus.DELETED
        deletedAt = LocalDateTime.now()
    }
}
