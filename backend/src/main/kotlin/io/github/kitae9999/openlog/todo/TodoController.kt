package io.github.kitae9999.openlog.todo

import io.github.kitae9999.openlog.common.exception.BadRequestException
import io.github.kitae9999.openlog.todo.dto.CreateTodoRequest
import io.github.kitae9999.openlog.todo.dto.TodoResponse
import io.github.kitae9999.openlog.todo.dto.UpdateTodoRequest
import io.github.kitae9999.openlog.user.entity.User
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.LocalDate

@RestController
@RequestMapping("/workspaces")
class TodoController(
    private val todoService: TodoService,
) {
    @PostMapping("/{workspaceId}/todos")
    fun createTodo(
        @AuthenticationPrincipal user: User,
        @PathVariable workspaceId: Long,
        @Valid @RequestBody request: CreateTodoRequest,
    ): ResponseEntity<TodoResponse> {
        val createdTodo = todoService.createTodo(
            user = user,
            workspaceId = workspaceId,
            title = request.title,
            plannedFor = request.plannedFor,
            taskId = request.taskId,
        )

        return ResponseEntity.status(201).body(createdTodo) // 리소스 생성은 201 created 명시적 반환
    }

    @PatchMapping("/{workspaceId}/todos/{todoId}")
    fun updateTodo(
        @AuthenticationPrincipal user: User,
        @PathVariable workspaceId: Long,
        @PathVariable todoId: Long,
        @Valid @RequestBody request: UpdateTodoRequest,
    ): TodoResponse {
        return todoService.updateTodoDone(
            userId = requireNotNull(user.id),
            workspaceId = workspaceId,
            todoId = todoId,
            done = request.done
                ?: throw BadRequestException("Todo 완료 상태는 필수입니다."),
        )
    }

    @DeleteMapping("/{workspaceId}/todos/{todoId}")
    fun deleteTodo(
        @AuthenticationPrincipal user: User,
        @PathVariable workspaceId: Long,
        @PathVariable todoId: Long,
    ): ResponseEntity<Void> {
        todoService.deleteTodo(
            userId = requireNotNull(user.id),
            workspaceId = workspaceId,
            todoId = todoId,
        )

        return ResponseEntity.noContent().build()
    }

    @GetMapping("/{workspaceId}/todos")
    fun getTodos(
        @AuthenticationPrincipal user: User,
        @PathVariable workspaceId: Long,
        @RequestParam plannedFor: LocalDate,
    ): List<TodoResponse> {
        return todoService.getTodos(
            userId = requireNotNull(user.id),
            workspaceId = workspaceId,
            plannedFor = plannedFor,
        )
    }
}
