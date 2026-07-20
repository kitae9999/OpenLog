package io.github.kitae9999.openlog.workspace

import io.github.kitae9999.openlog.activity.ActivityService
import io.github.kitae9999.openlog.activity.dto.ActivityDayLogsResponse
import io.github.kitae9999.openlog.activity.dto.WorkspaceActivityResponse
import io.github.kitae9999.openlog.memory.MemoryService
import io.github.kitae9999.openlog.memory.dto.MemoryCursorResponse
import io.github.kitae9999.openlog.output.OutputService
import io.github.kitae9999.openlog.todo.TodoService
import io.github.kitae9999.openlog.workspace.dto.WorkspaceLogCursorResponse
import io.github.kitae9999.openlog.workspace.dto.WorkspaceTaskCursorResponse
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.BDDMockito.given
import org.mockito.Mock
import org.mockito.Mockito.verify
import org.mockito.Mockito.verifyNoInteractions
import org.mockito.junit.jupiter.MockitoExtension
import java.time.LocalDate

@ExtendWith(MockitoExtension::class)
class WorkspaceViewServiceTest {
    @Mock private lateinit var workspaceTaskService: WorkspaceTaskService
    @Mock private lateinit var workspaceLogService: WorkspaceLogService
    @Mock private lateinit var workspaceLinkService: WorkspaceLinkService
    @Mock private lateinit var todoService: TodoService
    @Mock private lateinit var outputService: OutputService
    @Mock private lateinit var memoryService: MemoryService
    @Mock private lateinit var activityService: ActivityService
    private lateinit var service: WorkspaceViewService

    @BeforeEach
    fun setUp() {
        service = WorkspaceViewService(
            workspaceTaskService,
            workspaceLogService,
            workspaceLinkService,
            todoService,
            outputService,
            memoryService,
            activityService,
        )
    }

    @Test
    fun `planner view loads tasks and todos without loading logs`() {
        val from = LocalDate.of(2026, 7, 1)
        val to = LocalDate.of(2026, 7, 31)
        given(workspaceTaskService.getTasks(1L, 10L, null, null, 20))
            .willReturn(WorkspaceTaskCursorResponse(emptyList(), 20, null, false))
        given(todoService.getTodosInRange(1L, 10L, from, to)).willReturn(emptyList())

        val response = service.getPlannerView(1L, 10L, from, to)

        assertThat(response.tasks).isEmpty()
        assertThat(response.todos).isEmpty()
        verifyNoInteractions(workspaceLogService)
    }

    @Test
    fun `graph view combines graph resources into one response`() {
        given(workspaceTaskService.getTasks(1L, 10L, null, null, 20))
            .willReturn(WorkspaceTaskCursorResponse(emptyList(), 20, null, false))
        given(workspaceLogService.getLogs(1L, 10L, null, null, 20))
            .willReturn(WorkspaceLogCursorResponse(emptyList(), 20, null, false))
        given(outputService.getOutputs(1L, 10L, null)).willReturn(emptyList())
        given(memoryService.getMemories(1L, 10L, null, 20))
            .willReturn(MemoryCursorResponse(emptyList(), 20, null, false))
        given(workspaceLinkService.getTaskLinks(1L, 10L)).willReturn(emptyList())
        given(workspaceLinkService.getLogLinks(1L, 10L)).willReturn(emptyList())
        given(workspaceLinkService.getCrossLinks(1L, 10L)).willReturn(emptyList())

        val response = service.getGraphView(1L, 10L)

        assertThat(response.tasks).isEmpty()
        assertThat(response.logs).isEmpty()
        assertThat(response.crossLinks).isEmpty()
        verify(workspaceTaskService).getTasks(1L, 10L, null, null, 20)
        verify(workspaceLogService).getLogs(1L, 10L, null, null, 20)
    }

    @Test
    fun `activity view combines the range and selected day`() {
        val from = LocalDate.of(2025, 7, 21)
        val to = LocalDate.of(2026, 7, 20)
        val date = LocalDate.of(2026, 7, 20)
        val activity = WorkspaceActivityResponse(from.toString(), to.toString(), 0, emptyList())
        val day = ActivityDayLogsResponse(date.toString(), emptyList())
        given(activityService.getActivity(1L, 10L, from, to)).willReturn(activity)
        given(activityService.getDayLogs(1L, 10L, date)).willReturn(day)

        val response = service.getActivityView(1L, 10L, from, to, date)

        assertThat(response.activity).isEqualTo(activity)
        assertThat(response.selectedDay).isEqualTo(day)
    }
}
