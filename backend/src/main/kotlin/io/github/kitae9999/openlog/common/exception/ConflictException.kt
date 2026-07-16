package io.github.kitae9999.openlog.common.exception

class ConflictException(msg: String? = "요청이 현재 리소스 상태와 충돌합니다.") : RuntimeException(msg)
