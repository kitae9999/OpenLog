package io.github.kitae9999.openlog.output.entity

import io.github.kitae9999.openlog.workspace.entity.WorkspaceTask
import jakarta.persistence.EmbeddedId
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.MapsId
import jakarta.persistence.Table

@Entity
@Table(name = "output_tasks")
class OutputTask(
    output: WorkspaceOutput,
    task: WorkspaceTask,
) {
    @EmbeddedId
    var id: OutputTaskId = OutputTaskId(
        outputId = requireNotNull(output.id),
        taskId = requireNotNull(task.id),
    )
        protected set

    @MapsId("outputId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "output_id", nullable = false)
    var output: WorkspaceOutput = output
        protected set

    @MapsId("taskId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "task_id", nullable = false)
    var task: WorkspaceTask = task
        protected set
}
