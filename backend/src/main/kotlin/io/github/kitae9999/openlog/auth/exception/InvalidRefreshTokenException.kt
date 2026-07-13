package io.github.kitae9999.openlog.auth.exception

class InvalidRefreshTokenException : RuntimeException(
    "Refresh token이 유효하지 않거나 만료되었습니다.",
)
