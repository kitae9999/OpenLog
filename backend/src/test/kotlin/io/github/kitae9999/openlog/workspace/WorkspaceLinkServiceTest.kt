package io.github.kitae9999.openlog.workspace

import io.github.kitae9999.openlog.common.exception.BadRequestException
import io.github.kitae9999.openlog.common.exception.NotFoundException
import io.github.kitae9999.openlog.user.entity.User
import io.github.kitae9999.openlog.workspace.entity.LogKind
import io.github.kitae9999.openlog.workspace.entity.LogLink
import io.github.kitae9999.openlog.workspace.entity.LogLinkRelation
import io.github.kitae9999.openlog.workspace.entity.TaskLink
import io.github.kitae9999.openlog.workspace.entity.TaskLinkRelation
import io.github.kitae9999.openlog.workspace.entity.Workspace
import io.github.kitae9999.openlog.workspace.entity.WorkspaceLog
import io.github.kitae9999.openlog.workspace.entity.WorkspaceTask
import io.github.kitae9999.openlog.workspace.repository.LogLinkRepository
import io.github.kitae9999.openlog.workspace.repository.TaskLinkRepository
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.ArgumentCaptor
import org.mockito.ArgumentMatchers.any
import org.mockito.BDDMockito.given
import org.mockito.Mock
import org.mockito.Mockito.never
import org.mockito.Mockito.verify
import org.mockito.junit.jupiter.MockitoExtension
import java.util.Optional

@ExtendWith(MockitoExtension::class)
class WorkspaceLinkServiceTest {
    @Mock
    private lateinit var logLinkRepository: LogLinkRepository

    @Mock
    private lateinit var taskLinkRepository: TaskLinkRepository

    @Mock
    private lateinit var workspaceAccessResolver: WorkspaceAccessResolver

    private lateinit var workspaceLinkService: WorkspaceLinkService

    @BeforeEach
    fun setUp() {
        workspaceLinkService = WorkspaceLinkService(
            logLinkRepository = logLinkRepository,
            taskLinkRepository = taskLinkRepository,
            workspaceAccessResolver = workspaceAccessResolver,
            workspaceMapper = WorkspaceMapper(),
        )
    }

    @Test
    // 로그 링크가 현재 워크스페이스에 속하면 삭제한다.
    fun `deleteLogLink deletes owned log link`() {
        val owner = User(id = 1L, username = "alice")
        val workspace = workspace(owner)
        val fromLog = log(id = 10L, workspace = workspace, author = owner)
        val toLog = log(id = 20L, workspace = workspace, author = owner)
        val logLink = LogLink(
            id = 30L,
            fromLog = fromLog,
            toLog = toLog,
            relation = LogLinkRelation.RELATES_TO,
        )
        given(workspaceAccessResolver.requireOwnedWorkspace(1L, 100L)).willReturn(workspace)
        given(logLinkRepository.findById(30L)).willReturn(Optional.of(logLink))

        workspaceLinkService.deleteLogLink(userId = 1L, workspaceId = 100L, logLinkId = 30L)

        verify(logLinkRepository).delete(logLink)
    }

    @Test
    // 없는 로그 링크 삭제 요청은 NotFound로 실패한다.
    fun `deleteLogLink rejects missing link`() {
        val owner = User(id = 1L, username = "alice")
        val workspace = workspace(owner)
        given(workspaceAccessResolver.requireOwnedWorkspace(1L, 100L)).willReturn(workspace)
        given(logLinkRepository.findById(30L)).willReturn(Optional.empty())

        assertThatThrownBy {
            workspaceLinkService.deleteLogLink(userId = 1L, workspaceId = 100L, logLinkId = 30L)
        }.isInstanceOf(NotFoundException::class.java)

        verify(logLinkRepository, never()).delete(any(LogLink::class.java))
    }

    @Test
    // 같은 워크스페이스에 속한 두 태스크를 지정하면 태스크 링크를 저장하고 응답 DTO로 변환한다.
    fun `createTaskLink saves task link`() {
        val owner = User(id = 1L, username = "alice")
        val workspace = workspace(owner)
        val fromTask = task(id = 10L, workspace = workspace, author = owner, title = "From")
        val toTask = task(id = 20L, workspace = workspace, author = owner, title = "To")
        given(workspaceAccessResolver.requireOwnedWorkspace(1L, 100L)).willReturn(workspace)
        given(workspaceAccessResolver.requireOwnedTask(workspace, 10L)).willReturn(fromTask)
        given(workspaceAccessResolver.requireOwnedTask(workspace, 20L)).willReturn(toTask)
        given(taskLinkRepository.existsByFromTaskIdAndToTaskIdAndRelation(10L, 20L, TaskLinkRelation.BLOCKS))
            .willReturn(false)
        given(taskLinkRepository.save(any(TaskLink::class.java))).willAnswer { invocation ->
            val link = invocation.getArgument<TaskLink>(0)
            TaskLink(
                id = 30L,
                fromTask = link.fromTask,
                toTask = link.toTask,
                relation = link.relation,
            )
        }

        val response = workspaceLinkService.createTaskLink(
            userId = 1L,
            workspaceId = 100L,
            fromTaskId = 10L,
            toTaskId = 20L,
            relation = TaskLinkRelation.BLOCKS,
        )

        val taskLinkCaptor = ArgumentCaptor.forClass(TaskLink::class.java)
        verify(taskLinkRepository).save(taskLinkCaptor.capture())
        assertThat(taskLinkCaptor.value.fromTask).isSameAs(fromTask)
        assertThat(taskLinkCaptor.value.toTask).isSameAs(toTask)
        assertThat(taskLinkCaptor.value.relation).isEqualTo(TaskLinkRelation.BLOCKS)
        assertThat(response.id).isEqualTo(30L)
        assertThat(response.fromTask.id).isEqualTo(10L)
        assertThat(response.toTask.id).isEqualTo(20L)
        assertThat(response.relation).isEqualTo(TaskLinkRelation.BLOCKS)
    }

    @Test
    // 같은 태스크끼리는 링크를 만들 수 없다.
    fun `createTaskLink rejects self link`() {
        val owner = User(id = 1L, username = "alice")
        val workspace = workspace(owner)
        val task = task(id = 10L, workspace = workspace, author = owner)
        given(workspaceAccessResolver.requireOwnedWorkspace(1L, 100L)).willReturn(workspace)
        given(workspaceAccessResolver.requireOwnedTask(workspace, 10L)).willReturn(task)

        assertThatThrownBy {
            workspaceLinkService.createTaskLink(
                userId = 1L,
                workspaceId = 100L,
                fromTaskId = 10L,
                toTaskId = 10L,
                relation = TaskLinkRelation.RELATES_TO,
            )
        }.isInstanceOf(BadRequestException::class.java)

        verify(taskLinkRepository, never()).save(any(TaskLink::class.java))
    }

    @Test
    // 동일한 방향과 관계의 태스크 링크는 중복 저장하지 않는다.
    fun `createTaskLink rejects duplicate link`() {
        val owner = User(id = 1L, username = "alice")
        val workspace = workspace(owner)
        val fromTask = task(id = 10L, workspace = workspace, author = owner)
        val toTask = task(id = 20L, workspace = workspace, author = owner)
        given(workspaceAccessResolver.requireOwnedWorkspace(1L, 100L)).willReturn(workspace)
        given(workspaceAccessResolver.requireOwnedTask(workspace, 10L)).willReturn(fromTask)
        given(workspaceAccessResolver.requireOwnedTask(workspace, 20L)).willReturn(toTask)
        given(taskLinkRepository.existsByFromTaskIdAndToTaskIdAndRelation(10L, 20L, TaskLinkRelation.PRECEDES))
            .willReturn(true)

        assertThatThrownBy {
            workspaceLinkService.createTaskLink(
                userId = 1L,
                workspaceId = 100L,
                fromTaskId = 10L,
                toTaskId = 20L,
                relation = TaskLinkRelation.PRECEDES,
            )
        }.isInstanceOf(BadRequestException::class.java)

        verify(taskLinkRepository, never()).save(any(TaskLink::class.java))
    }

    @Test
    // 소유권 검사를 통과한 워크스페이스의 태스크 링크 목록만 응답한다.
    fun `getTaskLinks returns workspace task links`() {
        val owner = User(id = 1L, username = "alice")
        val workspace = workspace(owner)
        val fromTask = task(id = 10L, workspace = workspace, author = owner, title = "From")
        val toTask = task(id = 20L, workspace = workspace, author = owner, title = "To")
        val taskLink = TaskLink(
            id = 30L,
            fromTask = fromTask,
            toTask = toTask,
            relation = TaskLinkRelation.RELATES_TO,
        )
        given(workspaceAccessResolver.requireOwnedWorkspace(1L, 100L)).willReturn(workspace)
        given(taskLinkRepository.findAllByWorkspaceId(100L)).willReturn(listOf(taskLink))

        val response = workspaceLinkService.getTaskLinks(userId = 1L, workspaceId = 100L)

        assertThat(response).hasSize(1)
        assertThat(response.single().id).isEqualTo(30L)
        assertThat(response.single().fromTask.title).isEqualTo("From")
        assertThat(response.single().toTask.title).isEqualTo("To")
    }

    @Test
    // 태스크 링크가 현재 워크스페이스에 속하면 삭제한다.
    fun `deleteTaskLink deletes owned task link`() {
        val owner = User(id = 1L, username = "alice")
        val workspace = workspace(owner)
        val fromTask = task(id = 10L, workspace = workspace, author = owner)
        val toTask = task(id = 20L, workspace = workspace, author = owner)
        val taskLink = TaskLink(
            id = 30L,
            fromTask = fromTask,
            toTask = toTask,
            relation = TaskLinkRelation.BLOCKS,
        )
        given(workspaceAccessResolver.requireOwnedWorkspace(1L, 100L)).willReturn(workspace)
        given(taskLinkRepository.findById(30L)).willReturn(Optional.of(taskLink))

        workspaceLinkService.deleteTaskLink(userId = 1L, workspaceId = 100L, taskLinkId = 30L)

        verify(taskLinkRepository).delete(taskLink)
    }

    @Test
    // 없는 태스크 링크 삭제 요청은 NotFound로 실패한다.
    fun `deleteTaskLink rejects missing link`() {
        val owner = User(id = 1L, username = "alice")
        val workspace = workspace(owner)
        given(workspaceAccessResolver.requireOwnedWorkspace(1L, 100L)).willReturn(workspace)
        given(taskLinkRepository.findById(30L)).willReturn(Optional.empty())

        assertThatThrownBy {
            workspaceLinkService.deleteTaskLink(userId = 1L, workspaceId = 100L, taskLinkId = 30L)
        }.isInstanceOf(NotFoundException::class.java)

        verify(taskLinkRepository, never()).delete(any(TaskLink::class.java))
    }

    private fun workspace(owner: User): Workspace {
        return Workspace(
            id = 100L,
            owner = owner,
            slug = "default",
            name = "Default Workspace",
        )
    }

    private fun task(
        id: Long,
        workspace: Workspace,
        author: User,
        title: String = "Task",
    ): WorkspaceTask {
        return WorkspaceTask(
            id = id,
            workspace = workspace,
            author = author,
            title = title,
        )
    }

    private fun log(
        id: Long,
        workspace: Workspace,
        author: User,
        title: String = "Log",
    ): WorkspaceLog {
        return WorkspaceLog(
            id = id,
            workspace = workspace,
            author = author,
            kind = LogKind.NOTE,
            title = title,
            content = "content",
        )
    }
}
