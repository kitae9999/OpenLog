package io.github.kitae9999.openlog.follow.entity

import io.github.kitae9999.openlog.user.entity.User
import jakarta.persistence.Column
import jakarta.persistence.EmbeddedId
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.MapsId
import jakarta.persistence.Table
import java.time.LocalDateTime

@Entity
@Table(name = "follows")
class Follow(
    followingUser: User,
    followedUser: User,
) {
    // Todo: 복합키 방식을 굳이 쓸 필요가 있나? id+ unique제약으로 수정하자
    @EmbeddedId
    var id: FollowId = FollowId(
        followingUserId = requireNotNull(followingUser.id),
        followedUserId = requireNotNull(followedUser.id),
    )
        protected set

    @MapsId("followingUserId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "following_user_id", nullable = false)
    var followingUser: User = followingUser
        protected set

    @MapsId("followedUserId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "followed_user_id", nullable = false)
    var followedUser: User = followedUser
        protected set

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now()
        protected set
}
