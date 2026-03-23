package io.github.kitae9999.openlog.user.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.LocalDateTime

@Entity
@Table(name = "users")
class User(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    nickname: String? = null,

    profileImageUrl: String? = null,

    bio: String? = null,

    email: String? = null,
){
    @Column()
    var nickname: String? = nickname
        protected set

    @Column(name = "profile_image_url")
    var profileImageUrl: String? = profileImageUrl
        protected set

    @Column()
    var bio: String? = bio
        protected set

    @Column(unique = true)
    var email: String? = email
        protected set

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now()
        protected set

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
        protected set
}