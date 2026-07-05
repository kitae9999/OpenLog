package io.github.kitae9999.openlog.worklog.entity

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
import java.time.LocalDateTime

@Entity
@Table(
    name = "workspaces",
    uniqueConstraints = [
        UniqueConstraint(columnNames = ["owner_id", "slug"]),
    ],
)
class Workspace(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,
    owner: User,
    slug: String,
    name: String,
    repoFullName: String? = null,
) {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    var owner: User = owner
        protected set

    @Column(nullable = false)
    var slug: String = slug
        protected set

    @Column(nullable = false)
    var name: String = name
        protected set

    @Column(name = "repo_full_name")
    var repoFullName: String? = repoFullName
        protected set

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now()
        protected set

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
        protected set

    fun update(name: String, repoFullName: String?) {
        if (this.name == name && this.repoFullName == repoFullName) {
            return
        }

        this.name = name
        this.repoFullName = repoFullName
        this.updatedAt = LocalDateTime.now()
    }
}
