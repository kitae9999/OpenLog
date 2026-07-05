package io.github.kitae9999.openlog.task.entity

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
@Table(name = "tasks")
class WorkspaceTask(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,
    workspace: Workspace,
    author: User,
    title: String,
    description: String? = null,
    content: String? = null,
    status: TaskStatus = TaskStatus.TODO,
) {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "workspace_id", nullable = false)
    var workspace: Workspace = workspace
        protected set

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id", nullable = false)
    var author: User = author
        protected set

    @Column(nullable = false)
    var title: String = title
        protected set

    @Column(columnDefinition = "TEXT")
    var description: String? = description
        protected set

    @Column(columnDefinition = "TEXT")
    var content: String? = content
        protected set

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var status: TaskStatus = status
        protected set

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now()
        protected set

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
        protected set

    fun update(title: String, description: String?, content: String?, status: TaskStatus) {
        this.title = title
        this.description = description
        this.content = content
        this.status = status
        this.updatedAt = LocalDateTime.now()
    }
}
