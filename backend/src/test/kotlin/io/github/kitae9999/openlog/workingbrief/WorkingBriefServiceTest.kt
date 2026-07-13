package io.github.kitae9999.openlog.workingbrief

import io.github.kitae9999.openlog.common.exception.NotFoundException
import io.github.kitae9999.openlog.user.entity.User
import io.github.kitae9999.openlog.workingbrief.dto.UpsertWorkingBriefRequest
import io.github.kitae9999.openlog.workingbrief.entity.WorkspaceWorkingBrief
import io.github.kitae9999.openlog.workingbrief.repository.WorkspaceWorkingBriefRepository
import io.github.kitae9999.openlog.workspace.WorkspaceAccessResolver
import io.github.kitae9999.openlog.workspace.entity.Workspace
import io.github.kitae9999.openlog.workspace.entity.WorkspaceTask
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.ArgumentMatchers.any
import org.mockito.BDDMockito.given
import org.mockito.Mock
import org.mockito.Mockito.never
import org.mockito.Mockito.verify
import org.mockito.junit.jupiter.MockitoExtension

@ExtendWith(MockitoExtension::class)
class WorkingBriefServiceTest {
    @Mock private lateinit var repository: WorkspaceWorkingBriefRepository
    @Mock private lateinit var accessResolver: WorkspaceAccessResolver
    private lateinit var service: WorkingBriefService
    private lateinit var user: User
    private lateinit var workspace: Workspace

    @BeforeEach
    fun setUp() {
        service = WorkingBriefService(repository, accessResolver, WorkingBriefMapper())
        user = User(id = 1L, username = "alice")
        workspace = Workspace(id = 10L, owner = user, slug = "default", name = "Default")
    }

    @Test
    fun `upsertBrief creates when missing`() {
        given(accessResolver.requireOwnedWorkspace(1L, 10L)).willReturn(workspace)
        given(accessResolver.resolveTask(workspace, null)).willReturn(null)
        given(repository.findByWorkspaceId(10L)).willReturn(null)
        given(repository.save(any(WorkspaceWorkingBrief::class.java))).willAnswer { invocation ->
            val value = invocation.getArgument<WorkspaceWorkingBrief>(0)
            WorkspaceWorkingBrief(
                id = 20L,
                workspace = workspace,
                author = user,
                title = value.title,
                prose = value.prose,
                branch = value.branch,
            )
        }

        val response = service.upsertBrief(
            user,
            10L,
            UpsertWorkingBriefRequest(
                title = " Guest preview ",
                prose = " Started rewrite. ",
                branch = " feat/guest-preview ",
            ),
        )

        assertThat(response.title).isEqualTo("Guest preview")
        assertThat(response.prose).isEqualTo("Started rewrite.")
        assertThat(response.branch).isEqualTo("feat/guest-preview")
        assertThat(response.taskId).isNull()
    }

    @Test
    fun `upsertBrief overwrites existing row`() {
        val task = WorkspaceTask(
            id = 5L,
            workspace = workspace,
            author = user,
            title = "Make guest preview sell the loop",
            content = "body",
        )
        val existing = WorkspaceWorkingBrief(
            id = 20L,
            workspace = workspace,
            author = user,
            title = "Old",
            prose = "Old prose",
            branch = "old-branch",
        )
        given(accessResolver.requireOwnedWorkspace(1L, 10L)).willReturn(workspace)
        given(accessResolver.resolveTask(workspace, 5L)).willReturn(task)
        given(repository.findByWorkspaceId(10L)).willReturn(existing)

        val response = service.upsertBrief(
            user,
            10L,
            UpsertWorkingBriefRequest(
                title = "Make guest preview sell the loop",
                prose = "Rewrote the preview around OpenLog itself.",
                taskId = 5L,
                branch = "feat/guest-preview",
            ),
        )

        assertThat(response.title).isEqualTo("Make guest preview sell the loop")
        assertThat(response.prose).isEqualTo("Rewrote the preview around OpenLog itself.")
        assertThat(response.taskId).isEqualTo(5L)
        assertThat(response.taskTitle).isEqualTo("Make guest preview sell the loop")
        assertThat(response.branch).isEqualTo("feat/guest-preview")
        verify(repository, never()).save(any(WorkspaceWorkingBrief::class.java))
    }

    @Test
    fun `getBrief throws when missing`() {
        given(accessResolver.requireOwnedWorkspace(1L, 10L)).willReturn(workspace)
        given(repository.findByWorkspaceId(10L)).willReturn(null)

        assertThatThrownBy { service.getBrief(1L, 10L) }
            .isInstanceOf(NotFoundException::class.java)
    }

    @Test
    fun `clearBrief deletes existing row`() {
        val existing = WorkspaceWorkingBrief(
            id = 20L,
            workspace = workspace,
            author = user,
            title = "Title",
            prose = "Prose",
        )
        given(accessResolver.requireOwnedWorkspace(1L, 10L)).willReturn(workspace)
        given(repository.findByWorkspaceId(10L)).willReturn(existing)

        service.clearBrief(1L, 10L)

        verify(repository).delete(existing)
    }
}
