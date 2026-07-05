package io.github.kitae9999.openlog.worklog.entity

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
    name = "log_links",
    uniqueConstraints = [
        UniqueConstraint(columnNames = ["from_log_id", "to_log_id", "relation"]),
    ],
)
class LogLink(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,
    fromLog: WorkspaceLog,
    toLog: WorkspaceLog,
    relation: LogLinkRelation,
) {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "from_log_id", nullable = false)
    var fromLog: WorkspaceLog = fromLog
        protected set

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "to_log_id", nullable = false)
    var toLog: WorkspaceLog = toLog
        protected set

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var relation: LogLinkRelation = relation
        protected set

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now()
        protected set

    init {
        require(fromLog.id == null || toLog.id == null || fromLog.id != toLog.id) {
            "Log cannot link to itself."
        }
    }
}
