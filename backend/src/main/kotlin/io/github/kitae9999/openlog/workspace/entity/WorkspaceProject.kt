package io.github.kitae9999.openlog.workspace.entity

import io.github.kitae9999.openlog.user.entity.User
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
@Table(name = "workspace_projects")
class WorkspaceProject(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,
    owner: User,
    workspace: Workspace,
    displayName: String,
    repositoryFullName: String?,
    repositoryKey: String?,
    captureMode: WorkspaceCaptureMode = WorkspaceCaptureMode.ASK,
) {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    var owner: User = owner
        protected set

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "workspace_id", nullable = false)
    var workspace: Workspace = workspace
        protected set

    @Column(name = "display_name", nullable = false)
    var displayName: String = displayName
        protected set

    @Column(name = "repository_full_name")
    var repositoryFullName: String? = repositoryFullName
        protected set

    @Column(name = "repository_key")
    var repositoryKey: String? = repositoryKey
        protected set

    @Enumerated(EnumType.STRING)
    @Column(name = "capture_mode", nullable = false)
    var captureMode: WorkspaceCaptureMode = captureMode
        protected set

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now()
        protected set

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
        protected set

    fun update(
        workspace: Workspace,
        displayName: String,
        repositoryFullName: String?,
        repositoryKey: String?,
        captureMode: WorkspaceCaptureMode,
    ) {
        if (
            this.workspace.id == workspace.id &&
            this.displayName == displayName &&
            this.repositoryFullName == repositoryFullName &&
            this.repositoryKey == repositoryKey &&
            this.captureMode == captureMode
        ) {
            return
        }

        this.workspace = workspace
        this.displayName = displayName
        this.repositoryFullName = repositoryFullName
        this.repositoryKey = repositoryKey
        this.captureMode = captureMode
        this.updatedAt = LocalDateTime.now()
    }
}
