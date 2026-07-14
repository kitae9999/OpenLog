package io.github.kitae9999.openlog.workspace.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.MapsId
import jakarta.persistence.OneToOne
import jakarta.persistence.Table
import java.time.LocalDateTime

@Entity
@Table(name = "workspace_agent_guides")
class WorkspaceAgentGuide(
    workspace: Workspace,
    content: String,
) {
    @Id
    @Column(name = "workspace_id")
    val workspaceId: Long? = workspace.id

    @MapsId
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "workspace_id", nullable = false)
    var workspace: Workspace = workspace
        protected set

    @Column(nullable = false, columnDefinition = "TEXT")
    var content: String = content
        protected set

    @Column(nullable = false)
    var revision: Long = 1
        protected set

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now()
        protected set

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
        protected set

    fun update(content: String) {
        if (this.content == content) {
            return
        }

        this.content = content
        this.revision += 1
        this.updatedAt = LocalDateTime.now()
    }
}
