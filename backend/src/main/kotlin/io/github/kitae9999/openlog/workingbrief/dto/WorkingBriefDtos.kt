package io.github.kitae9999.openlog.workingbrief.dto

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

data class UpsertWorkingBriefRequest(
    @field:NotBlank(message = "Working brief 제목은 필수입니다.")
    @field:Size(max = 255, message = "Working brief 제목은 255자 이하여야 합니다.")
    val title: String,
    @field:NotBlank(message = "Working brief 본문은 필수입니다.")
    val prose: String,
    val taskId: Long? = null,
    @field:Size(max = 255, message = "브랜치명은 255자 이하여야 합니다.")
    val branch: String? = null,
)

data class WorkingBriefResponse(
    val title: String,
    val prose: String,
    val taskId: Long?,
    val taskTitle: String?,
    val branch: String?,
    val updatedAt: String,
)
