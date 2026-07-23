package io.github.kitae9999.openlog.workspace

import io.github.kitae9999.openlog.activity.ActivityService
import io.github.kitae9999.openlog.activity.dto.WorkspaceActivityResponse
import io.github.kitae9999.openlog.common.exception.NotFoundException
import io.github.kitae9999.openlog.memory.MemoryService
import io.github.kitae9999.openlog.memory.dto.MemoryCursorResponse
import io.github.kitae9999.openlog.output.OutputService
import io.github.kitae9999.openlog.todo.TodoService
import io.github.kitae9999.openlog.workingbrief.WorkingBriefService
import io.github.kitae9999.openlog.workspace.dto.TaskAuthorResponse
import io.github.kitae9999.openlog.workspace.dto.TaskDetailResponse
import io.github.kitae9999.openlog.workspace.dto.WorkspaceDashboardRefreshMode
import io.github.kitae9999.openlog.workspace.dto.WorkspaceDashboardRefreshZone
import io.github.kitae9999.openlog.workspace.dto.WorkspaceLogCursorResponse
import io.github.kitae9999.openlog.workspace.dto.WorkspaceLogDetailResponse
import io.github.kitae9999.openlog.workspace.dto.WorkspaceLogResponse
import io.github.kitae9999.openlog.workspace.dto.WorkspaceTaskCursorResponse
import io.github.kitae9999.openlog.workspace.dto.WorkspaceNavigationSummaryResponse
import io.github.kitae9999.openlog.workspace.dto.WorkspaceTaskResponse
import io.github.kitae9999.openlog.workspace.entity.LogKind
import io.github.kitae9999.openlog.workspace.entity.LogStatus
import io.github.kitae9999.openlog.workspace.entity.TaskStatus
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
        verify(workspaceLinkService).getTaskLinks(1L, 10L)
        verify(workspaceLinkService).getLogLinks(1L, 10L)
        verify(workspaceLinkService).getCrossLinks(1L, 10L)
        verify(todoService).getTodos(1L, 10L, to)
        verify(outputService).getRecentOutputs(1L, 10L, 1)
        verify(memoryService).getMemories(1L, 10L, null, 8)
        verify(workingBriefService).getBrief(1L, 10L)
        verify(activityService).getActivity(1L, 10L, from, to)
        verify(workspaceNavigationSummaryService).getSummary(1L, 10L)
    }

    @Test
    fun `single task refresh returns one patch bundle`() {
        val task = taskDetail(7L)
        val navigation = navigationSummary()
        given(workspaceTaskService.getTaskDetail(1L, 10L, 7L)).willReturn(task)
        given(workspaceNavigationSummaryService.getSummary(1L, 10L)).willReturn(navigation)

        val response = service.refreshDashboard(
            userId = 1L,
            workspaceId = 10L,
            zone = WorkspaceDashboardRefreshZone.TASKS,
            entityIds = listOf(7L),
            from = LocalDate.of(2025, 7, 21),
            to = LocalDate.of(2026, 7, 20),
        )

        assertThat(response.mode).isEqualTo(WorkspaceDashboardRefreshMode.PATCH)
        assertThat(response.task).isEqualTo(task)
        assertThat(response.tasks).isEmpty()
        assertThat(response.navigationSummary).isEqualTo(navigation)
        verify(workspaceTaskService).getTaskDetail(1L, 10L, 7L)
        verify(workspaceNavigationSummaryService).getSummary(1L, 10L)
    }

    @Test
    fun `task burst refresh returns one bounded replacement bundle`() {
        val task = taskSummary(8L)
        val navigation = navigationSummary()
        given(workspaceTaskService.getTasks(1L, 10L, null, null, 20))
            .willReturn(WorkspaceTaskCursorResponse(listOf(task), 20, null, false))
        given(workspaceNavigationSummaryService.getSummary(1L, 10L)).willReturn(navigation)

        val response = service.refreshDashboard(
            userId = 1L,
            workspaceId = 10L,
            zone = WorkspaceDashboardRefreshZone.TASKS,
            entityIds = listOf(7L, 8L),
            from = LocalDate.of(2025, 7, 21),
            to = LocalDate.of(2026, 7, 20),
        )

        assertThat(response.mode).isEqualTo(WorkspaceDashboardRefreshMode.REPLACE)
        assertThat(response.task).isNull()
        assertThat(response.tasks).containsExactly(task)
        verify(workspaceTaskService).getTasks(1L, 10L, null, null, 20)
        verify(workspaceNavigationSummaryService).getSummary(1L, 10L)
    }

    @Test
    fun `single log refresh returns affected log task navigation and activity in one bundle`() {
        val from = LocalDate.of(2025, 7, 21)
        val to = LocalDate.of(2026, 7, 20)
        val log = logDetail(9L, 7L)
        val linkedTask = taskDetail(7L)
        val navigation = navigationSummary()
        val activity = WorkspaceActivityResponse(from.toString(), to.toString(), 1, emptyList())
        given(workspaceLogService.getLogDetail(1L, 10L, 9L)).willReturn(log)
        given(workspaceTaskService.getTaskDetail(1L, 10L, 7L)).willReturn(linkedTask)
        given(workspaceNavigationSummaryService.getSummary(1L, 10L)).willReturn(navigation)
        given(activityService.getActivity(1L, 10L, from, to)).willReturn(activity)

        val response = service.refreshDashboard(
            userId = 1L,
            workspaceId = 10L,
            zone = WorkspaceDashboardRefreshZone.LOGS,
            entityIds = listOf(9L),
            from = from,
            to = to,
        )

        assertThat(response.mode).isEqualTo(WorkspaceDashboardRefreshMode.PATCH)
        assertThat(response.log).isEqualTo(log)
        assertThat(response.linkedTask).isEqualTo(linkedTask)
        assertThat(response.activity).isEqualTo(activity)
        verify(workspaceLogService).getLogDetail(1L, 10L, 9L)
        verify(workspaceTaskService).getTaskDetail(1L, 10L, 7L)
        verify(workspaceNavigationSummaryService).getSummary(1L, 10L)
        verify(activityService).getActivity(1L, 10L, from, to)
    }

    @Test
    fun `log burst refresh returns bounded replacement projections in one bundle`() {
        val from = LocalDate.of(2025, 7, 21)
        val to = LocalDate.of(2026, 7, 20)
        val task = taskSummary(7L)
        val log = logSummary(9L, 7L)
        val navigation = navigationSummary()
        val activity = WorkspaceActivityResponse(from.toString(), to.toString(), 2, emptyList())
        given(workspaceTaskService.getTasks(1L, 10L, null, null, 20))
            .willReturn(WorkspaceTaskCursorResponse(listOf(task), 20, null, false))
        given(workspaceLogService.getLogs(1L, 10L, null, null, 20))
            .willReturn(WorkspaceLogCursorResponse(listOf(log), 20, null, false))
        given(workspaceNavigationSummaryService.getSummary(1L, 10L)).willReturn(navigation)
        given(activityService.getActivity(1L, 10L, from, to)).willReturn(activity)

        val response = service.refreshDashboard(
            userId = 1L,
            workspaceId = 10L,
            zone = WorkspaceDashboardRefreshZone.LOGS,
            entityIds = listOf(9L, 10L),
            from = from,
            to = to,
        )

        assertThat(response.mode).isEqualTo(WorkspaceDashboardRefreshMode.REPLACE)
        assertThat(response.logs).containsExactly(log)
        assertThat(response.tasks).containsExactly(task)
        assertThat(response.activity).isEqualTo(activity)
        verify(workspaceTaskService).getTasks(1L, 10L, null, null, 20)
        verify(workspaceLogService).getLogs(1L, 10L, null, null, 20)
        verify(workspaceNavigationSummaryService).getSummary(1L, 10L)
        verify(activityService).getActivity(1L, 10L, from, to)
    }

    private fun navigationSummary() =
        WorkspaceNavigationSummaryResponse(
            activeTaskCount = 3,
            logsCount = 4,
            openIssuesCount = 1,
        )

    private fun taskDetail(id: Long) =
        TaskDetailResponse(
            id = id,
            title = "Task $id",
            description = null,
            content = null,
            status = TaskStatus.DOING,
            author = TaskAuthorResponse(
                id = 1L,
                username = "tester",
                nickname = "Tester",
                profileImageUrl = null,
            ),
            createdAt = "2026-07-20T00:00:00",
            updatedAt = "2026-07-20T01:00:00",
        )

    private fun taskSummary(id: Long) =
        WorkspaceTaskResponse(
            id = id,
            title = "Task $id",
            description = null,
            content = null,
            status = TaskStatus.DOING,
            authorName = "Tester",
            authorProfileImageUrl = null,
            createdAt = "2026-07-20T00:00:00",
            updatedAt = "2026-07-20T01:00:00",
        )

    private fun logDetail(id: Long, taskId: Long?) =
        WorkspaceLogDetailResponse(
            id = id,
            kind = LogKind.NOTE,
            status = LogStatus.NONE,
            title = "Log $id",
            summary = null,
            content = "body",
            authorName = "Tester",
            authorProfileImageUrl = null,
            taskId = taskId,
            createdAt = "2026-07-20T00:00:00",
            updatedAt = "2026-07-20T01:00:00",
            closedAt = null,
        )

    private fun logSummary(id: Long, taskId: Long?) =
        WorkspaceLogResponse(
            id = id,
            kind = LogKind.NOTE,
            status = LogStatus.NONE,
            title = "Log $id",
            summary = null,
            authorName = "Tester",
            authorProfileImageUrl = null,
            taskId = taskId,
            createdAt = "2026-07-20T00:00:00",
            updatedAt = "2026-07-20T01:00:00",
        )
}
