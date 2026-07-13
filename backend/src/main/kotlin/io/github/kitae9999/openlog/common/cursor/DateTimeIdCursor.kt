package io.github.kitae9999.openlog.common.cursor

import io.github.kitae9999.openlog.common.exception.BadRequestException
import java.time.LocalDateTime
import java.util.Base64

data class DateTimeIdCursor(
    val createdAt: LocalDateTime,
    val id: Long,
)

object DateTimeIdCursorCodec {
    /**
     * cursor 인스턴스의 createdAt과 id를 문자열로 합쳐서 인코딩
     */
    fun encode(createdAt: LocalDateTime, id: Long): String {
        val rawCursor = "$createdAt|$id"
        return Base64.getUrlEncoder().withoutPadding().encodeToString(rawCursor.toByteArray())
    }

    /**
     * cursor 쿼리파라미터 해석해서 createdAt과 id를 갖는 인스턴스로 반환
     */
    fun decode(cursor: String): DateTimeIdCursor {
        val decodedCursor = runCatching {
            String(Base64.getUrlDecoder().decode(cursor))
        }.getOrElse {
            throw BadRequestException("유효하지 않은 커서입니다.")
        }
        val delimiterIndex = decodedCursor.lastIndexOf('|')
        if (delimiterIndex < 1 || delimiterIndex == decodedCursor.lastIndex) {
            throw BadRequestException("유효하지 않은 커서입니다.")
        }

        return DateTimeIdCursor(
            createdAt = runCatching { LocalDateTime.parse(decodedCursor.substring(0, delimiterIndex)) }
                .getOrElse { throw BadRequestException("유효하지 않은 커서입니다.") },
            id = decodedCursor.substring(delimiterIndex + 1).toLongOrNull()
                ?: throw BadRequestException("유효하지 않은 커서입니다."),
        )
    }
}
