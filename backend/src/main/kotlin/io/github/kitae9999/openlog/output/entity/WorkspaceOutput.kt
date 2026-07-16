package io.github.kitae9999.openlog.output.entity

import io.github.kitae9999.openlog.user.entity.User
import io.github.kitae9999.openlog.workspace.entity.Workspace
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

    @Column(name = "exported_at")
    var exportedAt: LocalDateTime? = null
        protected set

    fun update(title: String, content: String) {
        require(status == OutputStatus.DRAFT) {
            "Only draft outputs can be updated."
        }

        this.title = title
        this.content = content
        this.updatedAt = LocalDateTime.now()
    }

    fun markExported() {
        require(status == OutputStatus.DRAFT) {
            "Only draft outputs can be exported."
        }

        status = OutputStatus.EXPORTED
        val now = LocalDateTime.now()
        exportedAt = now
        updatedAt = now
    }

    fun restoreDraft() {
        require(status == OutputStatus.EXPORTED) {
            "Only exported outputs can be restored."
        }

        status = OutputStatus.DRAFT
        exportedAt = null
        updatedAt = LocalDateTime.now()
    }
}
