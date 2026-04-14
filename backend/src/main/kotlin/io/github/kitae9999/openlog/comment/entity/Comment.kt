package io.github.kitae9999.openlog.comment.entity

import io.github.kitae9999.openlog.post.entity.Post
import io.github.kitae9999.openlog.user.entity.User
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.OneToOne
import jakarta.persistence.Table
import java.time.LocalDateTime

@Entity
@Table(
    name = "comments"
)
class Comment (
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id : Long? = null,
    post: Post,
    user : User,
    content: String
){
    @ManyToOne
    @JoinColumn(name = "post_id", nullable = false)
    var post : Post = post
        protected set

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    var user : User = user
        protected set

    @Column(columnDefinition = "TEXT", nullable = false)
    var content: String = content
        protected set

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now()
        protected set

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
        protected set

    fun updateComment(content: String) {
        if (this.content == content){
            return
        }
        this.content = content
        this.updatedAt = LocalDateTime.now()
    }

}
