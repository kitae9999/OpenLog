package io.github.kitae9999.openlog.todo.entity

import io.github.kitae9999.openlog.workspace.entity.WorkspaceLog
import io.github.kitae9999.openlog.workspace.entity.WorkspaceTask
import io.github.kitae9999.openlog.user.entity.User
import io.github.kitae9999.openlog.workspace.entity.Workspace
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import java.time.LocalDate
import java.time.LocalDateTime

@Entity
@Table(name = "todos")
class Todo(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,
    workspace: Workspace,
    author: User,
    task: WorkspaceTask? = null,
    originLog: WorkspaceLog? = null,
    title: String,
    done: Boolean = false,
    plannedFor: LocalDate,
    sortOrder: Int = 0,
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

    @Column(nullable = false)
    var done: Boolean = done
        protected set

    @Column(name = "planned_for", nullable = false)
    var plannedFor: LocalDate = plannedFor
        protected set

    @Column(name = "sort_order", nullable = false)
    var sortOrder: Int = sortOrder
        protected set

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now()
        protected set

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
        protected set

    @Column(name = "completed_at")
    var completedAt: LocalDateTime? = null
        protected set

    fun update(title: String, plannedFor: LocalDate, sortOrder: Int, task: WorkspaceTask?, originLog: WorkspaceLog?) {
        this.title = title
        this.plannedFor = plannedFor
        this.sortOrder = sortOrder
        this.task = task
        this.originLog = originLog
        this.updatedAt = LocalDateTime.now()
    }

    fun markDone() {
        if (done) {
            return
        }

        done = true
        completedAt = LocalDateTime.now()
        updatedAt = LocalDateTime.now()
    }

    fun markOpen() {
        if (!done) {
            return
        }

        done = false
        completedAt = null
        updatedAt = LocalDateTime.now()
    }
}
