package io.github.kitae9999.openlog.follow

import io.github.kitae9999.openlog.follow.entity.Follow
import io.github.kitae9999.openlog.follow.entity.FollowId
import org.springframework.data.jpa.repository.JpaRepository

interface FollowRepository: JpaRepository<Follow, FollowId> {
}
