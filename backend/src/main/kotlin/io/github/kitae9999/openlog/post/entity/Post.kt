package io.github.kitae9999.openlog.post.entity

import io.github.kitae9999.openlog.user.entity.User
import jakarta.persistence.Column
import jakarta.persistence.Entity
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

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now()
        protected set

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
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
}
