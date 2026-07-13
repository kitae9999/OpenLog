package io.github.kitae9999.openlog.todo.dto

import jakarta.validation.constraints.NotNull

data class UpdateTodoRequest(
    @field:NotNull(message = "Todo 완료 상태는 필수입니다.")
    val done: Boolean?,
)
