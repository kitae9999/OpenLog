package io.github.kitae9999.openlog.todo

import io.github.kitae9999.openlog.common.exception.BadRequestException
import io.github.kitae9999.openlog.todo.dto.TodoResponse
import io.github.kitae9999.openlog.todo.entity.Todo
import io.github.kitae9999.openlog.todo.repository.TodoRepository
import io.github.kitae9999.openlog.user.entity.User
import io.github.kitae9999.openlog.workspace.WorkspaceAccessResolver
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate

@Service
class TodoService(
    private val todoRepository: TodoRepository,
    private val workspaceAccessResolver: WorkspaceAccessResolver,
    private val todoMapper: TodoMapper,
) {
    @Transactional
    fun createTodo(
        user: User,
        workspaceId: Long,
        title: String,
        plannedFor: LocalDate?,
        taskId: Long?,
        originLogId: Long?,
    ): TodoResponse {
        val workspace = workspaceAccessResolver.requireOwnedWorkspace(requireNotNull(user.id), workspaceId)
        val task = workspaceAccessResolver.resolveTask(workspace, taskId)
        val originLog = originLogId?.let {
            workspaceAccessResolver.requireOwnedLog(workspace, it)
        }
        val resolvedPlannedFor = plannedFor
            ?: throw BadRequestException("Todo 날짜는 필수입니다.")
        val sortOrder = resolveNextSortOrder(workspaceId, resolvedPlannedFor)

        val todo = Todo(
            workspace = workspace,
            author = user,
            task = task,
            originLog = originLog,
            title = title.trim(),
            plannedFor = resolvedPlannedFor,
            sortOrder = sortOrder,
        )
        val savedTodo = todoRepository.save(todo)

        return todoMapper.toResponse(savedTodo)
    }

    @Transactional(readOnly = true)
    fun getTodos(userId: Long, workspaceId: Long, plannedFor: LocalDate): List<TodoResponse> {
        workspaceAccessResolver.requireOwnedWorkspace(userId, workspaceId)

        return todoRepository.findAllByWorkspaceIdAndPlannedForOrderBySortOrderAscIdAsc(
            workspaceId = workspaceId,
            plannedFor = plannedFor,
        ).map(todoMapper::toResponse)
    }

    private fun resolveNextSortOrder(workspaceId: Long, plannedFor: LocalDate): Int {
        val lastTodo = todoRepository.findTopByWorkspaceIdAndPlannedForOrderBySortOrderDescIdDesc(
            workspaceId = workspaceId,
            plannedFor = plannedFor,
        )

        return (lastTodo?.sortOrder ?: -1) + 1
    }
}
