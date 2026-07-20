package io.github.kitae9999.openlog.workspace

import io.github.kitae9999.openlog.activity.ActivityService
import io.github.kitae9999.openlog.activity.dto.WorkspaceActivityResponse
import io.github.kitae9999.openlog.common.exception.NotFoundException
import io.github.kitae9999.openlog.memory.MemoryService
import io.github.kitae9999.openlog.memory.dto.MemoryCursorResponse
import io.github.kitae9999.openlog.output.OutputService
import io.github.kitae9999.openlog.todo.TodoService
import io.github.kitae9999.openlog.workingbrief.WorkingBriefService
import io.github.kitae9999.openlog.workspace.dto.WorkspaceLogCursorResponse
import io.github.kitae9999.openlog.workspace.dto.WorkspaceTaskCursorResponse
import io.github.kitae9999.openlog.workspace.dto.WorkspaceNavigationSummaryResponse
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.BDDMockito.given
import org.mockito.Mock
import org.mockito.Mockito.verify
import org.mockito.junit.jupiter.MockitoExtension
import java.time.LocalDate

@ExtendWith(MockitoExtension::class)
class WorkspaceDashboardServiceTest {
    @Mock private lateinit var workspaceTaskService: WorkspaceTaskService
    @Mock private lateinit var workspaceLogService: WorkspaceLogService
    @Mock private lateinit var workspaceLinkService: WorkspaceLinkService
    @Mock private lateinit var todoService: TodoService
    @Mock private lateinit var outputService: OutputService
    @Mock private lateinit var memoryService: MemoryService
    @Mock private lateinit var workingBriefService: WorkingBriefService
    @Mock private lateinit var activityService: ActivityService
    @Mock private lateinit var workspaceNavigationSummaryService: WorkspaceNavigationSummaryService
    private lateinit var service: WorkspaceDashboardService

    @BeforeEach
    fun setUp() {
        service = WorkspaceDashboardService(
            workspaceTaskService,
            workspaceLogService,
            workspaceLinkService,
            todoService,
            outputService,
            memoryService,
            workingBriefService,
            activityService,
            workspaceNavigationSummaryService,
        )
    }

    @Test
    fun `getDashboard combines the workspace screen into one response`() {
        val from = LocalDate.of(2025, 7, 21)
        val to = LocalDate.of(2026, 7, 20)
        given(workspaceTaskService.getTasks(1L, 10L, null, null, 20))
            .willReturn(WorkspaceTaskCursorResponse(emptyList(), 20, null, false))
        given(workspaceLogService.getLogs(1L, 10L, null, null, 6))
            .willReturn(WorkspaceLogCursorResponse(emptyList(), 6, null, false))
        given(workspaceLinkService.getTaskLinks(1L, 10L)).willReturn(emptyList())
        given(workspaceLinkService.getLogLinks(1L, 10L)).willReturn(emptyList())
        given(workspaceLinkService.getCrossLinks(1L, 10L)).willReturn(emptyList())
        given(todoService.getTodos(1L, 10L, to)).willReturn(emptyList())
        given(outputService.getRecentOutputs(1L, 10L, 1)).willReturn(emptyList())
        given(memoryService.getMemories(1L, 10L, null, 8))
            .willReturn(MemoryCursorResponse(emptyList(), 8, null, false))
        given(workingBriefService.getBrief(1L, 10L)).willThrow(NotFoundException("missing"))
        given(activityService.getActivity(1L, 10L, from, to)).willReturn(
            WorkspaceActivityResponse(from.toString(), to.toString(), 0, emptyList()),
        )
        given(workspaceNavigationSummaryService.getSummary(1L, 10L)).willReturn(
            WorkspaceNavigationSummaryResponse(activeTaskCount = 12, logsCount = 42, openIssuesCount = 3),
        )

        val response = service.getDashboard(1L, 10L, from, to)

        assertThat(response.tasks).isEmpty()
        assertThat(response.logs).isEmpty()
        assertThat(response.workingBrief).isNull()
        assertThat(response.activity.from).isEqualTo("2025-07-21")
        assertThat(response.activity.to).isEqualTo("2026-07-20")
        assertThat(response.navigationSummary.logsCount).isEqualTo(42)
        verify(workspaceTaskService).getTasks(1L, 10L, null, null, 20)
        verify(workspaceLogService).getLogs(1L, 10L, null, null, 6)
        verify(todoService).getTodos(1L, 10L, to)
        verify(outputService).getRecentOutputs(1L, 10L, 1)
        verify(memoryService).getMemories(1L, 10L, null, 8)
    }
}
