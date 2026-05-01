package io.github.kitae9999.openlog.follow.entity

import jakarta.persistence.Column
import jakarta.persistence.Embeddable
import java.io.Serializable

@Embeddable
data class FollowId(
    @Column(name = "following_user_id")
    val followingUserId: Long = 0L,

    @Column(name = "followed_user_id")
    val followedUserId: Long = 0L,
) : Serializable
