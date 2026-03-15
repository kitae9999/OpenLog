package io.github.kitae9999.openlog.common.exception

import io.github.kitae9999.openlog.auth.exception.InvalidOAuthStateException
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice

@RestControllerAdvice
class GlobalExceptionHandler {
    @ExceptionHandler(InvalidOAuthStateException::class) // ::class는 클래스 참조 넘김
    fun handleInvalidOAuthState(e: InvalidOAuthStateException): ResponseEntity<ErrorResponse>{
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
            ErrorResponse(
                code = "INVALID_OAUTH_STATE",
                message = e.message ?: "잘못된 OAuth state입니다."
            )
        )
    }

    @ExceptionHandler(BadRequestException::class)
    fun handleBadRequestException(e: BadRequestException): ResponseEntity<ErrorResponse>{
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
            ErrorResponse(
                code = "BAD_REQUEST",
                message = e.message ?: "잘못된 요청입니다."
            )
        )
    }
}