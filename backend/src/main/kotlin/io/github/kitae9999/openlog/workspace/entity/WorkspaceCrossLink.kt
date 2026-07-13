package io.github.kitae9999.openlog.workspace.entity

import io.github.kitae9999.openlog.memory.entity.WorkspaceMemory
import io.github.kitae9999.openlog.output.entity.WorkspaceOutput
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
@Table(name = "cross_links")
class WorkspaceCrossLink(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,
    workspace: Workspace,
    relation: CrossLinkRelation,
    fromTask: WorkspaceTask? = null,
    fromLog: WorkspaceLog? = null,
    fromOutput: WorkspaceOutput? = null,
    fromMemory: WorkspaceMemory? = null,
    toTask: WorkspaceTask? = null,
    toLog: WorkspaceLog? = null,
    toOutput: WorkspaceOutput? = null,
    toMemory: WorkspaceMemory? = null,
) {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "workspace_id", nullable = false)
    var workspace: Workspace = workspace
        protected set

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_task_id")
    var fromTask: WorkspaceTask? = fromTask
        protected set

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_log_id")
    var fromLog: WorkspaceLog? = fromLog
        protected set

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_output_id")
    var fromOutput: WorkspaceOutput? = fromOutput
        protected set

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_memory_id")
    var fromMemory: WorkspaceMemory? = fromMemory
        protected set

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_task_id")
    var toTask: WorkspaceTask? = toTask
        protected set

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_log_id")
    var toLog: WorkspaceLog? = toLog
        protected set

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_output_id")
    var toOutput: WorkspaceOutput? = toOutput
        protected set

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_memory_id")
    var toMemory: WorkspaceMemory? = toMemory
        protected set

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var relation: CrossLinkRelation = relation
        protected set

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now()
        protected set

    init {
        require(fromNodes().count { it != null } == 1) {
            "Cross link requires exactly one source node."
        }
        require(toNodes().count { it != null } == 1) {
            "Cross link requires exactly one target node."
        }
        require(fromType() != toType()) {
            "Cross link requires different node types."
        }
    }

    fun fromType(): WorkspaceNodeType = nodeType(fromTask, fromLog, fromOutput, fromMemory)

    fun fromNodeId(): Long = nodeId(fromTask, fromLog, fromOutput, fromMemory)

    fun toType(): WorkspaceNodeType = nodeType(toTask, toLog, toOutput, toMemory)

    fun toNodeId(): Long = nodeId(toTask, toLog, toOutput, toMemory)

    fun matches(
        fromType: WorkspaceNodeType,
        fromNodeId: Long,
        toType: WorkspaceNodeType,
        toNodeId: Long,
        relation: CrossLinkRelation,
    ): Boolean =
        fromType() == fromType &&
            fromNodeId() == fromNodeId &&
            toType() == toType &&
            toNodeId() == toNodeId &&
            this.relation == relation

    private fun fromNodes(): List<Any?> = listOf(fromTask, fromLog, fromOutput, fromMemory)

    private fun toNodes(): List<Any?> = listOf(toTask, toLog, toOutput, toMemory)

    private fun nodeType(
        task: WorkspaceTask?,
        log: WorkspaceLog?,
        output: WorkspaceOutput?,
        memory: WorkspaceMemory?,
    ): WorkspaceNodeType = when {
        task != null -> WorkspaceNodeType.TASK
        log != null -> WorkspaceNodeType.LOG
        output != null -> WorkspaceNodeType.OUTPUT
        memory != null -> WorkspaceNodeType.MEMORY
        else -> error("Cross link node is missing.")
    }

    private fun nodeId(
        task: WorkspaceTask?,
        log: WorkspaceLog?,
        output: WorkspaceOutput?,
        memory: WorkspaceMemory?,
    ): Long = requireNotNull(task?.id ?: log?.id ?: output?.id ?: memory?.id)
}
