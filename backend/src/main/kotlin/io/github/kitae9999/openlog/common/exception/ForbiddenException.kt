package io.github.kitae9999.openlog.common.exception

class ForbiddenException(msg: String? = "권한이 없는 요청입니다.") : RuntimeException(msg)