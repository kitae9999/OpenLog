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
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.BDDMockito.given
import org.mockito.Mock
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
        )
    }

    @Test
    fun `getDashboard combines the workspace screen into one response`() {
        val from = LocalDate.of(2025, 7, 21)
        val to = LocalDate.of(2026, 7, 20)
        given(workspaceTaskService.getTasks(1L, 10L, null, null, 50))
            .willReturn(WorkspaceTaskCursorResponse(emptyList(), 20, null, false))
        given(workspaceLogService.getLogs(1L, 10L, null, null, 50))
            .willReturn(WorkspaceLogCursorResponse(emptyList(), 20, null, false))
        given(workspaceLinkService.getTaskLinks(1L, 10L)).willReturn(emptyList())
        given(workspaceLinkService.getLogLinks(1L, 10L)).willReturn(emptyList())
        given(workspaceLinkService.getCrossLinks(1L, 10L)).willReturn(emptyList())
        given(todoService.getAllTodos(1L, 10L)).willReturn(emptyList())
        given(outputService.getOutputs(1L, 10L, null)).willReturn(emptyList())
        given(memoryService.getMemories(1L, 10L, null, 50))
            .willReturn(MemoryCursorResponse(emptyList(), 50, null, false))
        given(workingBriefService.getBrief(1L, 10L)).willThrow(NotFoundException("missing"))
        given(activityService.getActivity(1L, 10L, from, to)).willReturn(
            WorkspaceActivityResponse(from.toString(), to.toString(), 0, emptyList()),
        )

        val response = service.getDashboard(1L, 10L, from, to)

        assertThat(response.tasks).isEmpty()
        assertThat(response.logs).isEmpty()
        assertThat(response.workingBrief).isNull()
        assertThat(response.activity.from).isEqualTo("2025-07-21")
        assertThat(response.activity.to).isEqualTo("2026-07-20")
    }
}
