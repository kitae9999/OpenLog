package io.github.kitae9999.openlog.workspace

import io.github.kitae9999.openlog.activity.ActivityService
import io.github.kitae9999.openlog.activity.dto.WorkspaceActivityResponse
import io.github.kitae9999.openlog.memory.MemoryService
import io.github.kitae9999.openlog.memory.dto.MemoryCursorResponse
import io.github.kitae9999.openlog.output.OutputService
import io.github.kitae9999.openlog.todo.TodoService
import io.github.kitae9999.openlog.workingbrief.WorkingBriefMapper
import io.github.kitae9999.openlog.workingbrief.WorkingBriefService
import io.github.kitae9999.openlog.workspace.dto.WorkspaceLogCursorResponse
import io.github.kitae9999.openlog.workspace.dto.WorkspaceNavigationSummaryResponse
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.BDDMockito.given
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase
import org.springframework.context.annotation.Import
import org.springframework.test.context.bean.override.mockito.MockitoBean
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate

@DataJpaTest(
    properties = [
        "spring.flyway.enabled=false",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.datasource.url=jdbc:h2:mem:workspace-dashboard-transaction;DB_CLOSE_DELAY=-1",
    ],
)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(
    WorkspaceDashboardService::class,
    WorkingBriefService::class,
    WorkingBriefMapper::class,
)
@Transactional(propagation = Propagation.NOT_SUPPORTED)
class WorkspaceDashboardTransactionIntegrationTest @Autowired constructor(
    private val workspaceDashboardService: WorkspaceDashboardService,
) {
    @MockitoBean private lateinit var workspaceTaskService: WorkspaceTaskService
    @MockitoBean private lateinit var workspaceLogService: WorkspaceLogService
    @MockitoBean private lateinit var workspaceLinkService: WorkspaceLinkService
    @MockitoBean private lateinit var todoService: TodoService
    @MockitoBean private lateinit var outputService: OutputService
    @MockitoBean private lateinit var memoryService: MemoryService
    @MockitoBean private lateinit var activityService: ActivityService
    @MockitoBean private lateinit var workspaceNavigationSummaryService: WorkspaceNavigationSummaryService
    @MockitoBean private lateinit var workspaceAccessResolver: WorkspaceAccessResolver
    @MockitoBean private lateinit var workspaceChangeNotifier: WorkspaceChangeNotifier

    private val from = LocalDate.of(2025, 7, 30)
    private val to = LocalDate.of(2026, 7, 29)

    @BeforeEach
    fun setUp() {
        given(workspaceTaskService.getActiveTasks(1L, 10L)).willReturn(emptyList())
        given(workspaceLogService.getLogs(1L, 10L, null, null, 6))
            .willReturn(WorkspaceLogCursorResponse(emptyList(), 6, null, false))
        given(workspaceLinkService.getTaskLinks(1L, 10L)).willReturn(emptyList())
        given(workspaceLinkService.getLogLinks(1L, 10L)).willReturn(emptyList())
        given(workspaceLinkService.getCrossLinks(1L, 10L)).willReturn(emptyList())
        given(todoService.getTodos(1L, 10L, to)).willReturn(emptyList())
        given(outputService.getRecentOutputs(1L, 10L, 1)).willReturn(emptyList())
        given(memoryService.getMemories(1L, 10L, null, 8))
            .willReturn(MemoryCursorResponse(emptyList(), 8, null, false))
        given(activityService.getActivity(1L, 10L, from, to)).willReturn(
            WorkspaceActivityResponse(from.toString(), to.toString(), 0, emptyList()),
        )
        given(workspaceNavigationSummaryService.getSummary(1L, 10L)).willReturn(
            WorkspaceNavigationSummaryResponse(0, 0, 0),
        )
    }

    @Test
    fun `dashboard transaction commits when the optional working brief is missing`() {
        val response = workspaceDashboardService.getDashboard(1L, 10L, from, to)

        assertThat(response.workingBrief).isNull()
    }
}
