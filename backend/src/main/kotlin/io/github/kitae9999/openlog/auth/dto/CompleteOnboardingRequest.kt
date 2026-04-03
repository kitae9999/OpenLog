package io.github.kitae9999.openlog.auth.dto

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size

data class CompleteOnboardingRequest(
    @field:NotBlank(message = "닉네임은 필수입니다.")
    @field:Size(max = 40, message = "닉네임은 40자 이하로 입력해주세요.")
    val nickname: String,

    @field:NotBlank(message = "username은 필수입니다.")
    @field:Size(min = 3, max = 20, message = "username은 3자 이상 20자 이하로 입력해주세요.")
    @field:Pattern(
        regexp = "^[a-z0-9]+$",
        message = "username은 영어 소문자와 숫자만 사용할 수 있습니다.",
    )
    val username: String,

    @field:Size(max = 160, message = "bio는 160자 이하로 입력해주세요.")
    val bio: String? = null,
)
