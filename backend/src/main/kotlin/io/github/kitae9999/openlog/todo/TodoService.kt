package io.github.kitae9999.openlog.todo

import io.github.kitae9999.openlog.common.exception.BadRequestException
import io.github.kitae9999.openlog.common.exception.NotFoundException
import io.github.kitae9999.openlog.todo.dto.TodoResponse
import io.github.kitae9999.openlog.todo.entity.Todo
import io.github.kitae9999.openlog.todo.repository.TodoRepository
import io.github.kitae9999.openlog.user.entity.User
import io.github.kitae9999.openlog.workspace.WorkspaceAccessResolver
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import kotlin.jvm.optionals.getOrNull

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
    ): TodoResponse {
        val workspace = workspaceAccessResolver.requireOwnedWorkspace(requireNotNull(user.id), workspaceId)
        val task = workspaceAccessResolver.resolveTask(workspace, taskId)
        val resolvedPlannedFor = plannedFor
            ?: throw BadRequestException("Todo 날짜는 필수입니다.")
        val sortOrder = resolveNextSortOrder(workspaceId, resolvedPlannedFor)

        val todo = Todo(
            workspace = workspace,
            author = user,
            task = task,
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
        ).map(todoMapper::toResponse) // 함수 참조 넘김
    }

    @Transactional
    fun updateTodoDone(
        userId: Long,
        workspaceId: Long,
        todoId: Long,
        done: Boolean,
    ): TodoResponse {
        val todo = requireOwnedTodo(userId, workspaceId, todoId)

        if (done) {
            todo.markDone()
        } else {
            todo.markOpen()
        }

        return todoMapper.toResponse(todoRepository.save(todo))
    }

    @Transactional
    fun deleteTodo(
        userId: Long,
        workspaceId: Long,
        todoId: Long,
    ) {
        val todo = requireOwnedTodo(userId, workspaceId, todoId)
        todoRepository.delete(todo)
    }

    private fun requireOwnedTodo(userId: Long, workspaceId: Long, todoId: Long): Todo {
        val workspace = workspaceAccessResolver.requireOwnedWorkspace(userId, workspaceId)
        val todo = todoRepository.findById(todoId).getOrNull()
            ?: throw NotFoundException("Todo를 찾을 수 없습니다.")

        if (todo.workspace.id != workspace.id) {
            throw BadRequestException("현재 워크스페이스에 속한 Todo만 수정할 수 있습니다.")
        }

        return todo
    }

    private fun resolveNextSortOrder(workspaceId: Long, plannedFor: LocalDate): Int {
        val lastTodo = todoRepository.findTopByWorkspaceIdAndPlannedForOrderBySortOrderDescIdDesc(
            workspaceId = workspaceId,
            plannedFor = plannedFor,
        )

        return (lastTodo?.sortOrder ?: -1) + 1 // 그날 todo 없으면 -1 +1 = 0 인덱스, 있으면 마지막 order + 1
    } 
}
