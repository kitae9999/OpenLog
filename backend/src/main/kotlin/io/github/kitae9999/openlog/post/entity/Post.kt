package io.github.kitae9999.openlog.post.entity

import io.github.kitae9999.openlog.output.entity.WorkspaceOutput
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
import jakarta.persistence.UniqueConstraint
import java.time.LocalDateTime

@Entity
@Table(
    name = "posts",
    uniqueConstraints = [
        UniqueConstraint(columnNames = ["author_id", "slug"]),
    ],
)
class Post(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,
    author: User,
    slug: String,
    title: String,
    description: String,
    content: String,
    version: Long = 0L,
    output: WorkspaceOutput? = null,
    status: PostStatus = PostStatus.DRAFT,
    publishedAt: LocalDateTime? = if (status == PostStatus.PUBLISHED) LocalDateTime.now() else null,
    unpublishedAt: LocalDateTime? = null,
) {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id", nullable = false)
    var author: User = author
        protected set

    @Column(nullable = false)
    var slug: String = slug
        protected set

    @Column(nullable = false)
    var title: String = title
        protected set

    @Column(columnDefinition = "TEXT", nullable = false)
    var description: String = description
        protected set

    @Column(columnDefinition = "TEXT", nullable = false)
    var content: String = content
        protected set

    @Column(nullable = false)
    var version: Long = version
        protected set

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var status: PostStatus = status
        protected set

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "output_id")
    var output: WorkspaceOutput? = output
        protected set

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now()
        protected set

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
        protected set

    @Column(name = "published_at")
    var publishedAt: LocalDateTime? = publishedAt
        protected set

    @Column(name = "unpublished_at")
    var unpublishedAt: LocalDateTime? = unpublishedAt
        protected set

    fun updatePost(slug: String, title: String, description: String, content: String): Boolean {
        if (
            this.slug == slug &&
            this.title == title &&
            this.description == description &&
            this.content == content
        ) {
            return false
        }

        this.slug = slug
        this.title = title
        this.description = description
        this.content = content

        this.updatedAt = LocalDateTime.now()
        this.version += 1
        return true
    }

    fun touchUpdatedAt() {
        this.updatedAt = LocalDateTime.now()
        this.version += 1
    }

    fun attachOutput(output: WorkspaceOutput) {
        this.output = output
        this.updatedAt = LocalDateTime.now()
        this.version += 1
    }

    fun publish(): Boolean {
        require(status != PostStatus.PUBLISHED) {
            "Only draft or unpublished posts can be published."
        }

        val shouldNotifyFollowers = status == PostStatus.DRAFT
        val now = LocalDateTime.now()
        status = PostStatus.PUBLISHED
        publishedAt = now
        unpublishedAt = null
        updatedAt = now
        version += 1
        return shouldNotifyFollowers
    }

    fun unpublish() {
        require(status == PostStatus.PUBLISHED) {
            "Only published posts can be unpublished."
        }

        val now = LocalDateTime.now()
        status = PostStatus.UNPUBLISHED
        unpublishedAt = now
        updatedAt = now
        version += 1
    }
}
