package io.github.kitae9999.openlog.post.entity

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
    name = "post_links",
    uniqueConstraints = [
        UniqueConstraint(columnNames = ["source_post_id", "target_post_id", "label"]),
    ],
)
class PostLink(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,
    sourcePost: Post,
    targetPost: Post,
    label: String,
) {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "source_post_id", nullable = false)
    var sourcePost: Post = sourcePost
        protected set

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "target_post_id", nullable = false)
    var targetPost: Post = targetPost
        protected set

    @Column(nullable = false)
    var label: String = label
        protected set

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now()
        protected set
}
