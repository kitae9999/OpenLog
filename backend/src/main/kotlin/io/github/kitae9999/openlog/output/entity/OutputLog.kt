package io.github.kitae9999.openlog.output.entity

import io.github.kitae9999.openlog.log.entity.WorkspaceLog
import jakarta.persistence.EmbeddedId
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.MapsId
import jakarta.persistence.Table

@Entity
@Table(name = "output_logs")
class OutputLog(
    output: WorkspaceOutput,
    log: WorkspaceLog,
) {
    @EmbeddedId
    var id: OutputLogId = OutputLogId(
        outputId = requireNotNull(output.id),
        logId = requireNotNull(log.id),
    )
        protected set

    @MapsId("outputId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "output_id", nullable = false)
    var output: WorkspaceOutput = output
        protected set

    @MapsId("logId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "log_id", nullable = false)
    var log: WorkspaceLog = log
        protected set
}
