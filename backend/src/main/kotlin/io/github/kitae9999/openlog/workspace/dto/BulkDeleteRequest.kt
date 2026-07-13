package io.github.kitae9999.openlog.workspace.dto

import jakarta.validation.constraints.Size

data class BulkDeleteRequest(
    @field:Size(min = 1, max = 100, message = "삭제할 문서는 1개 이상 100개 이하여야 합니다.")
    val ids: List<Long>,
)
