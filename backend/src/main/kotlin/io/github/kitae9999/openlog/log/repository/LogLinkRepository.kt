package io.github.kitae9999.openlog.log.repository

import io.github.kitae9999.openlog.log.entity.LogLink
import org.springframework.data.jpa.repository.JpaRepository

interface LogLinkRepository : JpaRepository<LogLink, Long> {
    fun findAllByFromLogId(fromLogId: Long): List<LogLink>
    fun findAllByToLogId(toLogId: Long): List<LogLink>
}
