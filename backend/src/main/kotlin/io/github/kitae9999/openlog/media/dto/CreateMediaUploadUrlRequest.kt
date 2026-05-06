package io.github.kitae9999.openlog.media.dto

import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank

data class CreateMediaUploadUrlRequest(
    @field:NotBlank(message = "파일 이름은 필수입니다.")
    val fileName: String,

    val originalFileName: String? = null,

    @field:NotBlank(message = "contentType은 필수입니다.")
    val contentType: String,

    @field:Min(value = 1, message = "파일 크기는 1바이트 이상이어야 합니다.")
    @field:Max(value = 10 * 1024 * 1024, message = "이미지는 10MB 이하로 업로드해주세요.")
    val sizeBytes: Long,

    @field:NotBlank(message = "purpose는 필수입니다.")
    val purpose: String,
)
