package io.github.kitae9999.openlog.output.entity

import io.github.kitae9999.openlog.user.entity.User
import io.github.kitae9999.openlog.worklog.entity.Workspace
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
@Table(name = "outputs")
class WorkspaceOutput(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,
    workspace: Workspace,
    author: User,
    type: OutputType,
    status: OutputStatus = OutputStatus.DRAFT,
    title: String,
    content: String,
) {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "workspace_id", nullable = false)
    var workspace: Workspace = workspace
        protected set

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id", nullable = false)
    var author: User = author
        protected set

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var type: OutputType = type
        protected set

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var status: OutputStatus = status
        protected set

    @Column(nullable = false)
    var title: String = title
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

    @Column(name = "published_at")
    var publishedAt: LocalDateTime? = null
        protected set

    fun update(title: String, content: String) {
        this.title = title
        this.content = content
        this.updatedAt = LocalDateTime.now()
    }

    fun markExported() {
        status = OutputStatus.EXPORTED
        updatedAt = LocalDateTime.now()
    }

    fun markPublished() {
        require(type == OutputType.POST_DRAFT) {
            "Only post draft outputs can be published as posts."
        }

        status = OutputStatus.PUBLISHED
        publishedAt = LocalDateTime.now()
        updatedAt = LocalDateTime.now()
    }

    fun archive() {
        status = OutputStatus.ARCHIVED
        updatedAt = LocalDateTime.now()
    }
}
