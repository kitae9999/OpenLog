package io.github.kitae9999.openlog.todo.dto

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import java.time.LocalDate

data class CreateTodoRequest(
    @field:NotBlank(message = "Todo 제목은 필수입니다.")
    val title: String,
    @field:NotNull(message = "Todo 날짜는 필수입니다.")
    val plannedFor: LocalDate?,
    val taskId: Long? = null,
    val originLogId: Long? = null,
)
