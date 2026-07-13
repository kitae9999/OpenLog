package io.github.kitae9999.openlog.memory.entity

import io.github.kitae9999.openlog.user.entity.User
import io.github.kitae9999.openlog.workspace.entity.Workspace
import io.github.kitae9999.openlog.workspace.entity.WorkspaceLog
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

@Entity
@Table(name = "memories")
class WorkspaceMemory(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,
    workspace: Workspace,
    author: User,
    task: WorkspaceTask? = null,
    originLog: WorkspaceLog? = null,
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id")
    var task: WorkspaceTask? = task
        protected set

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "origin_log_id")
    var originLog: WorkspaceLog? = originLog
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

    fun update(title: String, content: String, task: WorkspaceTask?) {
        this.title = title
        this.content = content
        this.task = task
        this.updatedAt = LocalDateTime.now()
    }
}
