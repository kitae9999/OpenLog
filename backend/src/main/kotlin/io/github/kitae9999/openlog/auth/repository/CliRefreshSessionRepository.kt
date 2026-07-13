package io.github.kitae9999.openlog.auth.repository

import io.github.kitae9999.openlog.auth.entity.CliRefreshSession
import jakarta.persistence.LockModeType
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Lock
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface CliRefreshSessionRepository : JpaRepository<CliRefreshSession, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select session from CliRefreshSession session where session.tokenHash = :tokenHash")
    fun findByTokenHashForUpdate(
        @Param("tokenHash") tokenHash: String,
    ): CliRefreshSession?
}
