package io.github.kitae9999.openlog.workspace.repository

import io.github.kitae9999.openlog.workspace.entity.LogLink
import org.springframework.data.jpa.repository.JpaRepository

interface LogLinkRepository : JpaRepository<LogLink, Long> {
    fun findAllByFromLogId(fromLogId: Long): List<LogLink>
    fun findAllByToLogId(toLogId: Long): List<LogLink>
}
