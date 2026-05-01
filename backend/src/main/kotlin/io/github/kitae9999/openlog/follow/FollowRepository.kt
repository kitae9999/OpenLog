package io.github.kitae9999.openlog.follow

import io.github.kitae9999.openlog.follow.entity.Follow
import io.github.kitae9999.openlog.follow.entity.FollowId
import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository

interface FollowRepository: JpaRepository<Follow, FollowId> {
    @EntityGraph(attributePaths = ["followingUser"])
    fun findAllByFollowedUser_IdOrderByCreatedAtDesc(followedUserId: Long): List<Follow>

    @EntityGraph(attributePaths = ["followedUser"])
    fun findAllByFollowingUser_IdOrderByCreatedAtDesc(followingUserId: Long): List<Follow>

    fun countByFollowedUser_Id(followedUserId: Long): Long

    fun countByFollowingUser_Id(followingUserId: Long): Long
}
