package io.github.kitae9999.openlog.user.dto

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

data class UpdateProfileRequest(
    @field:NotBlank(message = "닉네임은 필수입니다.")
    @field:Size(max = 40, message = "닉네임은 40자 이하로 입력해주세요.")
    val nickname: String,

    @field:Size(max = 160, message = "bio는 160자 이하로 입력해주세요.")
    val bio: String? = null,

    @field:Size(max = 100, message = "location은 100자 이하로 입력해주세요.")
    val location: String? = null,

    @field:Size(max = 2048, message = "website URL은 2048자 이하로 입력해주세요.")
    val websiteUrl: String? = null,
)
