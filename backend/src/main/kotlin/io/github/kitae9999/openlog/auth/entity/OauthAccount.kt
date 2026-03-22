package io.github.kitae9999.openlog.auth.entity

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
import jakarta.persistence.UniqueConstraint


@Entity
@Table(
    name = "oauth_accounts",
    uniqueConstraints = [UniqueConstraint(columnNames = ["provider","provider_user_id"])]
)
class OauthAccount(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id : Long? = null,
    user: User,
    provider: String,
    providerUserId: String
) {
    @Column(nullable = false)
    var provider: String = provider
        protected set

    @Column(name = "provider_user_id", nullable = false)
    var providerUserId: String = providerUserId
        protected set

    @ManyToOne(fetch = FetchType.LAZY, optional = false) // optional은 연관관계 비어있어도 되는지 여부, fetchtype은 처음부터 조인할지, 해당 정보가 실제로 필요할때 가져올지
    @JoinColumn(name = "user_id")
    var user: User = user
}