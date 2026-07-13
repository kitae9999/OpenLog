package io.github.kitae9999.openlog.output.repository

import io.github.kitae9999.openlog.output.entity.OutputTask
import io.github.kitae9999.openlog.output.entity.OutputTaskId
import org.springframework.data.jpa.repository.JpaRepository

interface OutputTaskRepository : JpaRepository<OutputTask, OutputTaskId> {
    fun findAllByOutputId(outputId: Long): List<OutputTask>
    fun findAllByTaskId(taskId: Long): List<OutputTask>
}
