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

    username: String? = null,

    nickname: String? = null,

    profileImageUrl: String? = null,

    bio: String? = null,

    email: String? = null,

    location: String? = null,

    websiteUrl : String? = null,
){
    @Column(unique = true)
    var username: String? = username
        protected set

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

    @Column()
    var location: String? = location
        protected set

    @Column(name = "website_url")
    var websiteUrl: String? = websiteUrl
        protected set

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now()
        protected set

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
        protected set

    fun updateProfile(
        nickname: String,
        bio: String?,
        location: String?,
        websiteUrl: String?,
    ) {
        this.nickname = nickname
        this.bio = bio
        this.location = location
        this.websiteUrl = websiteUrl
        this.updatedAt = LocalDateTime.now()
    }

    fun completeOnboarding(
        nickname: String,
        username: String,
        bio: String?,
    ) {
        this.nickname = nickname
        this.username = username
        this.bio = bio
        this.updatedAt = LocalDateTime.now()
    }

    fun isOnboardingComplete(): Boolean =
        !nickname.isNullOrBlank() && !username.isNullOrBlank()
}
