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
import jakarta.persistence.Version
import java.time.LocalDateTime

@Entity
@Table(
    name = "posts",
)
class Post(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,
    blogId: Long,
    author: User,
    title: String,
    description: String,
    content: String,
    version: Long = 0L,
) {
    @Column(name = "blog_id", nullable = false)
    var blogId: Long = blogId
        protected set

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id", nullable = false)
    var author: User = author
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

    @Version
    @Column(nullable = false)
    var version: Long = version
        protected set

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now()
        protected set

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
        protected set
}
