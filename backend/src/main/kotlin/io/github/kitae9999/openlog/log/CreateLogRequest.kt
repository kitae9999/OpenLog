package io.github.kitae9999.openlog.log

import io.github.kitae9999.openlog.log.entity.LogKind
import io.github.kitae9999.openlog.log.entity.LogStatus
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull

data class CreateLogRequest(
    @field:NotNull(message = "로그 종류는 필수입니다.")
    val kind: LogKind,

    @field:NotBlank(message = "제목은 필수입니다.")
    val title: String,

    @field:NotBlank(message = "본문은 필수입니다.")
    val content: String,

    val summary: String? = null,

    val taskId: Long? = null,

    val status: LogStatus? = null,
)
