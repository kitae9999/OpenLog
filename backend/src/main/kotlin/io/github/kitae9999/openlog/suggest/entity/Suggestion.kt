package io.github.kitae9999.openlog.suggest.entity

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

@Entity
@Table(
    name = "suggestions"
)
class Suggestion (
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id : Long? = null,

    post: Post,
    user: User,
    content: String,
    description: String,
    status: SuggestionStatus = SuggestionStatus.OPEN,
    postBaseVersion: Long,
) {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "post_id")
    var post: Post = post
        protected set

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    var user: User = user
        protected set

    @Column(nullable = false)
    var content: String = content
        protected set

    @Column(nullable = false)
    var description: String = description
        protected set

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var status: SuggestionStatus = status
        protected set

    @Column(name = "post_base_version", nullable = false)
    var postBaseVersion: Long = postBaseVersion
        protected set

    @Column(name = "created_at" ,nullable = false)
    var createdAt : LocalDateTime = LocalDateTime.now()
        protected set

    @Column(name = "updated_at", nullable = false)
    var updatedAt : LocalDateTime = LocalDateTime.now()
        protected set

}