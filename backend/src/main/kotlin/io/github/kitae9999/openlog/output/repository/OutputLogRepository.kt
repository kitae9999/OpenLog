package io.github.kitae9999.openlog.output.repository

import io.github.kitae9999.openlog.output.entity.OutputLog
import io.github.kitae9999.openlog.output.entity.OutputLogId
import org.springframework.data.jpa.repository.JpaRepository

interface OutputLogRepository : JpaRepository<OutputLog, OutputLogId> {
    fun findAllByOutputId(outputId: Long): List<OutputLog>
    fun findAllByLogId(logId: Long): List<OutputLog>
}
