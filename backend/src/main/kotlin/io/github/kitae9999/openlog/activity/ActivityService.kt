package io.github.kitae9999.openlog.activity

import io.github.kitae9999.openlog.activity.dto.ActivityDayLogsResponse
import io.github.kitae9999.openlog.activity.dto.ActivityDayResponse
import io.github.kitae9999.openlog.activity.dto.WorkspaceActivityResponse
import io.github.kitae9999.openlog.common.exception.BadRequestException
import io.github.kitae9999.openlog.workspace.WorkspaceAccessResolver
import io.github.kitae9999.openlog.workspace.WorkspaceMapper
import io.github.kitae9999.openlog.workspace.repository.WorkspaceLogRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.temporal.ChronoUnit

@Service
class ActivityService(
    private val workspaceLogRepository: WorkspaceLogRepository,
    private val workspaceAccessResolver: WorkspaceAccessResolver,
    private val workspaceMapper: WorkspaceMapper,
) {
    @Transactional(readOnly = true)
    fun getActivity(userId: Long, workspaceId: Long, from: LocalDate, to: LocalDate): WorkspaceActivityResponse {
        validateRange(from, to)
        workspaceAccessResolver.requireOwnedWorkspace(userId, workspaceId)
        val counts = workspaceLogRepository.findCreatedAtByWorkspaceIdAndRange(
            workspaceId = workspaceId,
            from = from.atStartOfDay(),
            toExclusive = to.plusDays(1).atStartOfDay(),
        ).groupingBy { it.toLocalDate() }.eachCount()
        val days = generateSequence(from) { current ->
            current.plusDays(1).takeIf { !it.isAfter(to) }
        }.map { date -> ActivityDayResponse(date.toString(), counts[date] ?: 0) }.toList()

        return WorkspaceActivityResponse(
            from = from.toString(),
            to = to.toString(),
            totalLogCount = counts.values.sum(),
            days = days,
        )
    }

    @Transactional(readOnly = true)
    fun getDayLogs(userId: Long, workspaceId: Long, date: LocalDate): ActivityDayLogsResponse {
        workspaceAccessResolver.requireOwnedWorkspace(userId, workspaceId)
        val logs = workspaceLogRepository
            .findAllByWorkspaceIdAndCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtDescIdDesc(
                workspaceId,
                date.atStartOfDay(),
                date.plusDays(1).atStartOfDay(),
            )

        return ActivityDayLogsResponse(date.toString(), logs.map(workspaceMapper::toLogResponse))
    }

    private fun validateRange(from: LocalDate, to: LocalDate) {
        if (from.isAfter(to)) {
            throw BadRequestException("활동 조회 시작일은 종료일보다 늦을 수 없습니다.")
        }
        if (ChronoUnit.DAYS.between(from, to) + 1 > MAX_RANGE_DAYS) {
            throw BadRequestException("활동 조회 기간은 최대 366일입니다.")
        }
    }

    private companion object {
        private const val MAX_RANGE_DAYS = 366L
    }
}
