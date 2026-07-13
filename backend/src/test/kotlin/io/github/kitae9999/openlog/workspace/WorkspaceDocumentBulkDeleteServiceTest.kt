package io.github.kitae9999.openlog.workspace

import io.github.kitae9999.openlog.common.exception.BadRequestException
import io.github.kitae9999.openlog.user.entity.User
import io.github.kitae9999.openlog.workspace.entity.LogKind
import io.github.kitae9999.openlog.workspace.entity.LogStatus
import io.github.kitae9999.openlog.workspace.entity.Workspace
import io.github.kitae9999.openlog.workspace.entity.WorkspaceLog
import io.github.kitae9999.openlog.workspace.entity.WorkspaceTask
import io.github.kitae9999.openlog.workspace.repository.WorkspaceLogRepository
import io.github.kitae9999.openlog.workspace.repository.WorkspaceTaskRepository
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.BDDMockito.given
import org.mockito.Mock
import org.mockito.Mockito.never
import org.mockito.Mockito.verify
import org.mockito.junit.jupiter.MockitoExtension

@ExtendWith(MockitoExtension::class)
class WorkspaceDocumentBulkDeleteServiceTest {
    @Mock private lateinit var taskRepository: WorkspaceTaskRepository
    @Mock private lateinit var logRepository: WorkspaceLogRepository
    @Mock private lateinit var accessResolver: WorkspaceAccessResolver
    private lateinit var taskService: WorkspaceTaskService
    private lateinit var logService: WorkspaceLogService
    private lateinit var workspace: Workspace
    private lateinit var user: User

    @BeforeEach
    fun setUp() {
        user = User(id = 1L, username = "alice")
        workspace = Workspace(id = 10L, owner = user, slug = "default", name = "Default")
        val mapper = WorkspaceMapper()
        taskService = WorkspaceTaskService(taskRepository, accessResolver, mapper)
        logService = WorkspaceLogService(logRepository, accessResolver, mapper)
    }

    @Test
    fun `deleteTasks validates all ids then deletes distinct tasks`() {
        val first = WorkspaceTask(id = 20L, workspace = workspace, author = user, title = "First")
        val second = WorkspaceTask(id = 30L, workspace = workspace, author = user, title = "Second")
        given(accessResolver.requireOwnedWorkspace(1L, 10L)).willReturn(workspace)
        given(accessResolver.requireOwnedTask(workspace, 20L)).willReturn(first)
        given(accessResolver.requireOwnedTask(workspace, 30L)).willReturn(second)

        taskService.deleteTasks(1L, 10L, listOf(20L, 20L, 30L))

        verify(taskRepository).deleteAll(listOf(first, second))
    }

    @Test
    fun `deleteTasks does not delete when any ownership check fails`() {
        val first = WorkspaceTask(id = 20L, workspace = workspace, author = user, title = "First")
        given(accessResolver.requireOwnedWorkspace(1L, 10L)).willReturn(workspace)
        given(accessResolver.requireOwnedTask(workspace, 20L)).willReturn(first)
        given(accessResolver.requireOwnedTask(workspace, 99L))
            .willThrow(BadRequestException("다른 워크스페이스의 태스크입니다."))

        org.assertj.core.api.Assertions.assertThatThrownBy {
            taskService.deleteTasks(1L, 10L, listOf(20L, 99L))
        }.isInstanceOf(BadRequestException::class.java)

        verify(taskRepository, never()).deleteAll(org.mockito.ArgumentMatchers.anyList())
    }

    @Test
    fun `deleteLogs validates all ids then deletes logs`() {
        val first = WorkspaceLog(
            id = 40L,
            workspace = workspace,
            author = user,
            kind = LogKind.NOTE,
            status = LogStatus.NONE,
            title = "First",
            content = "Body",
        )
        val second = WorkspaceLog(
            id = 50L,
            workspace = workspace,
            author = user,
            kind = LogKind.FIX,
            status = LogStatus.NONE,
            title = "Second",
            content = "Body",
        )
        given(accessResolver.requireOwnedWorkspace(1L, 10L)).willReturn(workspace)
        given(accessResolver.requireOwnedLog(workspace, 40L)).willReturn(first)
        given(accessResolver.requireOwnedLog(workspace, 50L)).willReturn(second)

        logService.deleteLogs(1L, 10L, listOf(40L, 50L))

        verify(logRepository).deleteAll(listOf(first, second))
    }
}
