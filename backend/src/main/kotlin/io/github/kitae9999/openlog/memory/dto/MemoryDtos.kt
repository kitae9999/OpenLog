package io.github.kitae9999.openlog.memory.dto

import jakarta.validation.constraints.NotBlank

data class CreateMemoryRequest(
    @field:NotBlank(message = "Memory 제목은 필수입니다.")
    val title: String,
    @field:NotBlank(message = "Memory 본문은 필수입니다.")
    val content: String,
    val taskId: Long? = null,
)

data class UpdateMemoryRequest(
    @field:NotBlank(message = "Memory 제목은 필수입니다.")
    val title: String,
    @field:NotBlank(message = "Memory 본문은 필수입니다.")
    val content: String,
    val taskId: Long? = null,
)

data class MemoryReferenceResponse(
    val id: Long,
    val title: String,
)

data class MemoryResponse(
    val id: Long,
    val title: String,
    val content: String,
    val excerpt: String,
    val task: MemoryReferenceResponse?,
    val originLog: MemoryReferenceResponse?,
    val createdAt: String,
    val updatedAt: String,
)

data class MemoryCursorResponse(
    val memories: List<MemoryResponse>,
    val size: Int,
    val nextCursor: String?,
    val hasNext: Boolean,
)
