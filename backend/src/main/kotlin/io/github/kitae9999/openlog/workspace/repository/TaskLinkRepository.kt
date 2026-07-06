package io.github.kitae9999.openlog.workspace.repository

import io.github.kitae9999.openlog.workspace.entity.TaskLink
import org.springframework.data.jpa.repository.JpaRepository

interface TaskLinkRepository : JpaRepository<TaskLink, Long>
