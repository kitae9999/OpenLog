package io.github.kitae9999.openlog.common.exception

import io.github.kitae9999.openlog.auth.exception.InvalidOAuthStateException
import io.github.kitae9999.openlog.auth.exception.OAuthAuthenticationException
import io.github.kitae9999.openlog.auth.exception.UnauthorizedException
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.MethodArgumentNotValidException
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

    @ExceptionHandler(NotFoundException::class)
    fun handleNotFoundException(e: NotFoundException): ResponseEntity<ErrorResponse> {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
            ErrorResponse(
                code = "NOT_FOUND",
                message = e.message ?: "요청한 리소스를 찾을 수 없습니다.",
            )
        )
    }

    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleMethodArgumentNotValidException(e: MethodArgumentNotValidException): ResponseEntity<ErrorResponse> {
        val message = e.bindingResult.fieldErrors.firstOrNull()?.defaultMessage
            ?: "입력값을 다시 확인해주세요."

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
            ErrorResponse(
                code = "VALIDATION_ERROR",
                message = message,
            )
        )
    }

    @ExceptionHandler(OAuthAuthenticationException::class)
    fun handleOAuthAuthenticationException(e: OAuthAuthenticationException): ResponseEntity<ErrorResponse> {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
            ErrorResponse(
                code = "OAUTH_AUTHENTICATION_FAILED",
                message = e.message ?: "OAuth 인증에 실패했습니다."
            )
        )
    }

    @ExceptionHandler(UnauthorizedException::class)
    fun handleUnauthorizedException(e: UnauthorizedException): ResponseEntity<ErrorResponse>{
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
            ErrorResponse(
                code="NOT_LOGGED_ IN",
                message = e.message ?: "로그인이 필요합니다."
            )
        )
    }

    @ExceptionHandler(UsernameAlreadyTakenException::class)
    fun handleUsernameAlreadyTakenException(e: UsernameAlreadyTakenException): ResponseEntity<ErrorResponse> {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(
            ErrorResponse(
                code = "USERNAME_TAKEN",
                message = e.message ?: "이미 사용 중인 username입니다.",
            )
        )
    }

    @ExceptionHandler(ForbiddenException::class)
    fun handleForbiddenException(e: ForbiddenException): ResponseEntity<ErrorResponse>{
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
            ErrorResponse(
                code = "FORBIDDEN",
                message = e.message ?: "권한이 없는 요청입니다."
            )
        )
    }
}
