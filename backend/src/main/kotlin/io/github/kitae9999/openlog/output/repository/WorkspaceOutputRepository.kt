package io.github.kitae9999.openlog.output.repository

import io.github.kitae9999.openlog.output.entity.OutputStatus
import io.github.kitae9999.openlog.output.entity.WorkspaceOutput
import jakarta.persistence.LockModeType
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Lock
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface WorkspaceOutputRepository : JpaRepository<WorkspaceOutput, Long> {
    fun findAllByWorkspaceIdOrderByUpdatedAtDesc(workspaceId: Long): List<WorkspaceOutput>
    fun findAllByWorkspaceIdAndStatusOrderByUpdatedAtDesc(workspaceId: Long, status: OutputStatus): List<WorkspaceOutput>

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select o from WorkspaceOutput o where o.id = :id")
    fun findByIdForUpdate(@Param("id") id: Long): WorkspaceOutput?
}
