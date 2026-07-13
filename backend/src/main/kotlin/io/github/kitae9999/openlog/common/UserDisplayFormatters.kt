package io.github.kitae9999.openlog.common

import io.github.kitae9999.openlog.user.entity.User

fun resolveAuthorName(user: User): String {
    return when {
        !user.nickname.isNullOrBlank() -> user.nickname.orEmpty()
        !user.username.isNullOrBlank() -> user.username.orEmpty()
        !user.email.isNullOrBlank() -> user.email.orEmpty()
        else -> "OpenLog member"
    }
}
