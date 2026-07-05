package io.github.kitae9999.openlog.worklog.entity

import io.github.kitae9999.openlog.task.entity.WorkspaceTask
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
@Table(name = "logs")
class WorkspaceLog(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,
    workspace: Workspace,
    author: User,
    task: WorkspaceTask? = null,
    kind: LogKind,
    status: LogStatus = LogStatus.NONE,
    title: String,
    summary: String? = null,
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

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var kind: LogKind = kind
        protected set

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var status: LogStatus = status
        protected set

    @Column(nullable = false)
    var title: String = title
        protected set

    @Column(columnDefinition = "TEXT")
    var summary: String? = summary
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

    @Column(name = "closed_at")
    var closedAt: LocalDateTime? = null
        protected set

    init {
        requireValidStatus(kind, status)
    }

    fun update(title: String, summary: String?, content: String, task: WorkspaceTask?) {
        this.title = title
        this.summary = summary
        this.content = content
        this.task = task
        this.updatedAt = LocalDateTime.now()
    }

    fun closeIssue() {
        require(kind == LogKind.ISSUE) { "Only issue logs can be closed." }
        status = LogStatus.CLOSED
        closedAt = LocalDateTime.now()
        updatedAt = LocalDateTime.now()
    }

    fun reopenIssue() {
        require(kind == LogKind.ISSUE) { "Only issue logs can be reopened." }
        status = LogStatus.OPEN
        closedAt = null
        updatedAt = LocalDateTime.now()
    }

    private fun requireValidStatus(kind: LogKind, status: LogStatus) {
        if (kind == LogKind.ISSUE) {
            require(status == LogStatus.OPEN || status == LogStatus.CLOSED) {
                "Issue logs must be OPEN or CLOSED."
            }
            return
        }

        require(status == LogStatus.NONE) {
            "Non-issue logs must use NONE status."
        }
    }
}
