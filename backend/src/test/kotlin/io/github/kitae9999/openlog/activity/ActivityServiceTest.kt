package io.github.kitae9999.openlog.activity

import io.github.kitae9999.openlog.common.exception.BadRequestException
import io.github.kitae9999.openlog.workspace.WorkspaceAccessResolver
import io.github.kitae9999.openlog.workspace.WorkspaceMapper
import io.github.kitae9999.openlog.workspace.repository.WorkspaceLogRepository
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.BDDMockito.given
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import java.time.LocalDate
import java.time.LocalDateTime

@ExtendWith(MockitoExtension::class)
class ActivityServiceTest {
    @Mock private lateinit var repository: WorkspaceLogRepository
    @Mock private lateinit var accessResolver: WorkspaceAccessResolver
    private lateinit var service: ActivityService

    @BeforeEach
    fun setUp() {
        service = ActivityService(repository, accessResolver, WorkspaceMapper())
    }

    @Test
    fun `getActivity includes both date boundaries and fills empty days`() {
        val from = LocalDate.of(2026, 7, 1)
        val to = LocalDate.of(2026, 7, 3)
        given(repository.findCreatedAtByWorkspaceIdAndRange(10L, from.atStartOfDay(), to.plusDays(1).atStartOfDay()))
            .willReturn(listOf(LocalDateTime.of(2026, 7, 1, 0, 0), LocalDateTime.of(2026, 7, 3, 23, 59)))

        val response = service.getActivity(1L, 10L, from, to)

        assertThat(response.days.map { it.logCount }).containsExactly(1, 0, 1)
        assertThat(response.totalLogCount).isEqualTo(2)
    }

    @Test
    fun `getActivity rejects more than 366 days`() {
        assertThatThrownBy {
            service.getActivity(1L, 10L, LocalDate.of(2025, 1, 1), LocalDate.of(2026, 1, 2))
        }.isInstanceOf(BadRequestException::class.java)
    }
}
