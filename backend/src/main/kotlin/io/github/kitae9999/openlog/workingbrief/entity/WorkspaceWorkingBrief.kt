package io.github.kitae9999.openlog.workingbrief.entity

import io.github.kitae9999.openlog.user.entity.User
import io.github.kitae9999.openlog.workspace.entity.Workspace
import io.github.kitae9999.openlog.workspace.entity.WorkspaceTask
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import java.time.LocalDateTime

/** One latest “where we are” brief per workspace — agent overwrite, not a feed. */
@Entity
@Table(name = "working_briefs")
class WorkspaceWorkingBrief(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,
    workspace: Workspace,
    author: User,
    task: WorkspaceTask? = null,
    title: String,
    prose: String,
    branch: String? = null,
) {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "workspace_id", nullable = false)
    var workspace: Workspace = workspace
        protected set

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id", nullable = false)
    var author: User = author
        protected set

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id")
    var task: WorkspaceTask? = task
        protected set

    @Column(nullable = false)
    var title: String = title
        protected set

    @Column(columnDefinition = "TEXT", nullable = false)
    var prose: String = prose
        protected set

    @Column
    var branch: String? = branch
        protected set

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now()
        protected set

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
        protected set

    fun update(
        author: User,
        title: String,
        prose: String,
        task: WorkspaceTask?,
        branch: String?,
    ) {
        this.author = author
        this.title = title
        this.prose = prose
        this.task = task
        this.branch = branch
        this.updatedAt = LocalDateTime.now()
    }
}
