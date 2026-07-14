package io.github.kitae9999.openlog.workspace

import io.github.kitae9999.openlog.common.exception.BadRequestException
import io.github.kitae9999.openlog.common.exception.NotFoundException
import io.github.kitae9999.openlog.user.entity.User
import io.github.kitae9999.openlog.workspace.dto.CreateWorkspaceProjectRequest
import io.github.kitae9999.openlog.workspace.entity.Workspace
import io.github.kitae9999.openlog.workspace.entity.WorkspaceCaptureMode
import io.github.kitae9999.openlog.workspace.entity.WorkspaceProject
import io.github.kitae9999.openlog.workspace.repository.WorkspaceProjectRepository
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
class WorkspaceProjectServiceTest {
    @Mock
    private lateinit var projectRepository: WorkspaceProjectRepository

    @Mock
    private lateinit var workspaceAccessResolver: WorkspaceAccessResolver

    @Mock
    private lateinit var guideService: WorkspaceAgentGuideService

    private lateinit var projectService: WorkspaceProjectService

    @BeforeEach
    fun setUp() {
        projectService = WorkspaceProjectService(
            projectRepository = projectRepository,
            workspaceAccessResolver = workspaceAccessResolver,
            workspaceMapper = WorkspaceMapper(),
            guideService = guideService,
        )
    }

    @Test
    fun `createProject creates a local binding with ASK as default`() {
        val owner = User(id = 1L, username = "alice")
        val workspace = Workspace(id = 10L, owner = owner, slug = "default", name = "Default")
        given(workspaceAccessResolver.requireOwnedWorkspace(1L, 10L)).willReturn(workspace)
        given(projectRepository.save(any(WorkspaceProject::class.java))).willAnswer { invocation ->
            val project = invocation.getArgument<WorkspaceProject>(0)
            WorkspaceProject(
                id = 20L,
                owner = project.owner,
                workspace = project.workspace,
                displayName = project.displayName,
                repositoryFullName = project.repositoryFullName,
                repositoryKey = project.repositoryKey,
                captureMode = project.captureMode,
            )
        }

        val response = projectService.createProject(
            user = owner,
            workspaceId = 10L,
            request = CreateWorkspaceProjectRequest(displayName = " local-api "),
        )

        assertThat(response.id).isEqualTo(20L)
        assertThat(response.displayName).isEqualTo("local-api")
        assertThat(response.repositoryFullName).isNull()
        assertThat(response.captureMode).isEqualTo(WorkspaceCaptureMode.ASK)
    }

    @Test
    fun `createProject rejects a repository already bound by the owner`() {
        val owner = User(id = 1L, username = "alice")
        val workspace = Workspace(id = 10L, owner = owner, slug = "default", name = "Default")
        val existing = WorkspaceProject(
            id = 19L,
            owner = owner,
            workspace = workspace,
            displayName = "OpenLog",
            repositoryFullName = "Alice/OpenLog",
            repositoryKey = "alice/openlog",
        )
        given(workspaceAccessResolver.requireOwnedWorkspace(1L, 10L)).willReturn(workspace)
        given(projectRepository.findByOwnerIdAndRepositoryKey(1L, "alice/openlog")).willReturn(existing)

        assertThatThrownBy {
            projectService.createProject(
                user = owner,
                workspaceId = 10L,
                request = CreateWorkspaceProjectRequest(
                    displayName = "OpenLog",
                    repositoryFullName = "Alice/OpenLog.git",
                ),
            )
        }.isInstanceOf(BadRequestException::class.java)

        verify(projectRepository, never()).save(any(WorkspaceProject::class.java))
    }

    @Test
    fun `getProject does not expose another owner's binding`() {
        given(projectRepository.findByIdAndOwnerId(20L, 1L)).willReturn(null)

        assertThatThrownBy { projectService.getProject(userId = 1L, projectId = 20L) }
            .isInstanceOf(NotFoundException::class.java)
    }
}
