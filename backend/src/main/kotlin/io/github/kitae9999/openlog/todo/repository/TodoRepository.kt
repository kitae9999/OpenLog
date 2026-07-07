package io.github.kitae9999.openlog.todo.repository

import io.github.kitae9999.openlog.todo.entity.Todo
import org.springframework.data.jpa.repository.JpaRepository
import java.time.LocalDate

interface TodoRepository : JpaRepository<Todo, Long> {
    fun findAllByWorkspaceIdAndPlannedForOrderBySortOrderAscIdAsc(workspaceId: Long, plannedFor: LocalDate): List<Todo>

    fun findTopByWorkspaceIdAndPlannedForOrderBySortOrderDescIdDesc(workspaceId: Long, plannedFor: LocalDate): Todo?
}
