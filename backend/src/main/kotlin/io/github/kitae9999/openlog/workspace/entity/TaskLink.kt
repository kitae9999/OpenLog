package io.github.kitae9999.openlog.workspace.entity

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
import jakarta.persistence.UniqueConstraint
import java.time.LocalDateTime

@Entity
@Table(
    name = "task_links",
    uniqueConstraints = [
        UniqueConstraint(columnNames = ["from_task_id", "to_task_id", "relation"]),
    ],
)
class TaskLink(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,
    fromTask: WorkspaceTask,
    toTask: WorkspaceTask,
    relation: TaskLinkRelation,
) {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "from_task_id", nullable = false)
    var fromTask: WorkspaceTask = fromTask
        protected set

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "to_task_id", nullable = false)
    var toTask: WorkspaceTask = toTask
        protected set

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var relation: TaskLinkRelation = relation
        protected set

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now()
        protected set

    init {
        require(fromTask.id == null || toTask.id == null || fromTask.id != toTask.id) {
            "Task cannot link to itself."
        }
    }
}
