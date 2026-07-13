package io.github.kitae9999.openlog.auth.repository

import io.github.kitae9999.openlog.auth.entity.WebRefreshSession
import jakarta.persistence.LockModeType
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Lock
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface WebRefreshSessionRepository : JpaRepository<WebRefreshSession, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select session from WebRefreshSession session where session.tokenHash = :tokenHash")
    fun findByTokenHashForUpdate(
        @Param("tokenHash") tokenHash: String,
    ): WebRefreshSession?
}
