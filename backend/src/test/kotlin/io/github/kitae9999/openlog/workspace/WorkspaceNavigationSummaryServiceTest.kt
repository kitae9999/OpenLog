package io.github.kitae9999.openlog.workspace

import io.github.kitae9999.openlog.workspace.entity.LogKind
import io.github.kitae9999.openlog.workspace.entity.LogStatus
import io.github.kitae9999.openlog.workspace.entity.TaskStatus
import io.github.kitae9999.openlog.workspace.repository.WorkspaceLogRepository
import io.github.kitae9999.openlog.workspace.repository.WorkspaceTaskRepository
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.BDDMockito.given
import org.mockito.Mock
import org.mockito.Mockito.verify
import org.mockito.junit.jupiter.MockitoExtension

@ExtendWith(MockitoExtension::class)
class WorkspaceNavigationSummaryServiceTest {
    @Mock private lateinit var workspaceAccessResolver: WorkspaceAccessResolver
    @Mock private lateinit var workspaceTaskRepository: WorkspaceTaskRepository
    @Mock private lateinit var workspaceLogRepository: WorkspaceLogRepository
    private lateinit var service: WorkspaceNavigationSummaryService

    @BeforeEach
    fun setUp() {
        service = WorkspaceNavigationSummaryService(
            workspaceAccessResolver,
            workspaceTaskRepository,
            workspaceLogRepository,
        )
    }

    @Test
    fun `summary counts todo and doing tasks as active without loading rows`() {
        given(
            workspaceTaskRepository.countByWorkspaceIdAndStatusIn(
                10L,
                listOf(TaskStatus.TODO, TaskStatus.DOING),
            ),
        ).willReturn(7)
        given(workspaceLogRepository.countByWorkspaceId(10L)).willReturn(12)
        given(
            workspaceLogRepository.countByWorkspaceIdAndKindAndStatus(10L, LogKind.ISSUE, LogStatus.OPEN),
        ).willReturn(2)

        val response = service.getSummary(1L, 10L)

        assertThat(response.activeTaskCount).isEqualTo(7)
        assertThat(response.logsCount).isEqualTo(12)
        assertThat(response.openIssuesCount).isEqualTo(2)
        verify(workspaceAccessResolver).requireOwnedWorkspace(1L, 10L)
        verify(workspaceTaskRepository).countByWorkspaceIdAndStatusIn(
            10L,
            listOf(TaskStatus.TODO, TaskStatus.DOING),
        )
    }

    @Test
    fun `summary returns zero when there are no active tasks`() {
        given(
            workspaceTaskRepository.countByWorkspaceIdAndStatusIn(
                10L,
                listOf(TaskStatus.TODO, TaskStatus.DOING),
            ),
        ).willReturn(0)
        given(workspaceLogRepository.countByWorkspaceId(10L)).willReturn(0)
        given(
            workspaceLogRepository.countByWorkspaceIdAndKindAndStatus(10L, LogKind.ISSUE, LogStatus.OPEN),
        ).willReturn(0)

        val response = service.getSummary(1L, 10L)

        assertThat(response.activeTaskCount).isZero()
    }
}
