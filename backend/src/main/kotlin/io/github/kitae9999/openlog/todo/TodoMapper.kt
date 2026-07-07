package io.github.kitae9999.openlog.todo

import io.github.kitae9999.openlog.todo.dto.TodoResponse
import io.github.kitae9999.openlog.todo.entity.Todo
import org.springframework.stereotype.Component

@Component
class TodoMapper {
    fun toResponse(todo: Todo): TodoResponse {
        return TodoResponse(
            id = requireNotNull(todo.id),
            title = todo.title,
            done = todo.done,
            plannedFor = todo.plannedFor.toString(),
            sortOrder = todo.sortOrder,
            taskId = todo.task?.id,
            originLogId = todo.originLog?.id,
            createdAt = todo.createdAt.toString(),
            updatedAt = todo.updatedAt.toString(),
            completedAt = todo.completedAt?.toString(),
        )
    }
}
