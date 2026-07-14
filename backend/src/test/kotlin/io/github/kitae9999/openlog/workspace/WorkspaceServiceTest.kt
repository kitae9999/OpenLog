package io.github.kitae9999.openlog.workspace

import io.github.kitae9999.openlog.common.exception.BadRequestException
import io.github.kitae9999.openlog.user.entity.User
import io.github.kitae9999.openlog.workspace.dto.CreateWorkspaceRequest
import io.github.kitae9999.openlog.workspace.dto.UpdateWorkspaceRequest
import io.github.kitae9999.openlog.workspace.entity.Workspace
import io.github.kitae9999.openlog.workspace.entity.WorkspaceAgentGuide
import io.github.kitae9999.openlog.workspace.entity.WorkspaceCaptureMode
import io.github.kitae9999.openlog.workspace.entity.WorkspaceProject
import io.github.kitae9999.openlog.workspace.repository.WorkspaceAgentGuideRepository
import io.github.kitae9999.openlog.workspace.repository.WorkspaceProjectRepository
import io.github.kitae9999.openlog.workspace.repository.WorkspaceRepository
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

@ExtendWith(MockitoExtension::class)
class WorkspaceServiceTest {
    @Mock
    private lateinit var workspaceRepository: WorkspaceRepository

    @Mock
    private lateinit var guideRepository: WorkspaceAgentGuideRepository

    @Mock
    private lateinit var projectRepository: WorkspaceProjectRepository

    @Mock
    private lateinit var workspaceAccessResolver: WorkspaceAccessResolver

    private lateinit var workspaceService: WorkspaceService

    @BeforeEach
    fun setUp() {
        workspaceService = WorkspaceService(
            workspaceRepository = workspaceRepository,
            guideRepository = guideRepository,
            projectRepository = projectRepository,
            workspaceAccessResolver = workspaceAccessResolver,
            workspaceMapper = WorkspaceMapper(),
        )
    }

    @Test
    // 로그인한 사용자가 소유한 워크스페이스 목록만 응답 DTO로 변환해 반환하는지 검증한다.
    fun `getWorkspaces returns owner workspaces`() {
        val owner = User(id = 1L, username = "alice")
        val workspace = Workspace(
            id = 10L,
            owner = owner,
            slug = "default",
            name = "Default Workspace",
        )
        val project = WorkspaceProject(
            id = 20L,
            owner = owner,
            workspace = workspace,
            displayName = "alice/openlog",
            repositoryFullName = "alice/openlog",
            repositoryKey = "alice/openlog",
        )
        given(workspaceRepository.findAllByOwnerIdOrderByUpdatedAtDescIdDesc(1L))
            .willReturn(listOf(workspace))
        given(projectRepository.findAllByOwnerIdOrderByUpdatedAtDescIdDesc(1L))
            .willReturn(listOf(project))

        val response = workspaceService.getWorkspaces(1L)

        assertThat(response).hasSize(1)
        assertThat(response.single().id).isEqualTo(10L)
        assertThat(response.single().slug).isEqualTo("default")
        assertThat(response.single().name).isEqualTo("Default Workspace")
        assertThat(response.single().projects.single().repositoryFullName).isEqualTo("alice/openlog")
    }

    @Test
    // 생성 요청의 slug/name/repo 값을 정규화한 뒤 owner와 함께 저장하는지 검증한다.
    fun `createWorkspace normalizes slug and saves workspace`() {
        val owner = User(id = 1L, username = "alice")
        given(workspaceRepository.existsByOwnerIdAndSlug(1L, "team-space")).willReturn(false)
        given(workspaceRepository.save(any(Workspace::class.java))).willAnswer { invocation ->
            val workspace = invocation.getArgument<Workspace>(0)
            Workspace(
                id = 10L,
                owner = workspace.owner,
                slug = workspace.slug,
                name = workspace.name,
            )
        }
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

        val response = workspaceService.createWorkspace(
            owner,
            CreateWorkspaceRequest(
                slug = " Team-Space ",
                name = " Team Space ",
                repoFullName = " alice/openlog ",
            ),
        )

        val workspaceCaptor = ArgumentCaptor.forClass(Workspace::class.java)
        val guideCaptor = ArgumentCaptor.forClass(WorkspaceAgentGuide::class.java)
        val projectCaptor = ArgumentCaptor.forClass(WorkspaceProject::class.java)
        verify(workspaceRepository).save(workspaceCaptor.capture())
        verify(guideRepository).save(guideCaptor.capture())
        verify(projectRepository).save(projectCaptor.capture())
        assertThat(workspaceCaptor.value.owner).isSameAs(owner)
        assertThat(workspaceCaptor.value.slug).isEqualTo("team-space")
        assertThat(workspaceCaptor.value.name).isEqualTo("Team Space")
        assertThat(guideCaptor.value.content).isEqualTo(DefaultWorkspaceAgentGuide.CONTENT)
        assertThat(projectCaptor.value.repositoryFullName).isEqualTo("alice/openlog")
        assertThat(projectCaptor.value.captureMode).isEqualTo(WorkspaceCaptureMode.ASK)
        assertThat(response.id).isEqualTo(10L)
        assertThat(response.slug).isEqualTo("team-space")
        assertThat(response.projects.single().id).isEqualTo(20L)
    }

    @Test
    // 같은 사용자 안에서 이미 사용 중인 slug는 중복 생성하지 못해야 한다.
    fun `createWorkspace rejects duplicate slug`() {
        val owner = User(id = 1L, username = "alice")
        given(workspaceRepository.existsByOwnerIdAndSlug(1L, "default")).willReturn(true)

        assertThatThrownBy {
            workspaceService.createWorkspace(
                owner,
                CreateWorkspaceRequest(slug = "default", name = "Default"),
            )
        }.isInstanceOf(BadRequestException::class.java)

        verify(workspaceRepository, never()).save(any(Workspace::class.java))
    }

    @Test
    // 같은 사용자의 저장소는 한 워크스페이스에만 연결할 수 있다.
    fun `createWorkspace rejects duplicate repository binding`() {
        val owner = User(id = 1L, username = "alice")
        val existingWorkspace = Workspace(id = 9L, owner = owner, slug = "old", name = "Old")
        val existingProject = WorkspaceProject(
            id = 19L,
            owner = owner,
            workspace = existingWorkspace,
            displayName = "alice/openlog",
            repositoryFullName = "Alice/OpenLog",
            repositoryKey = "alice/openlog",
        )
        given(workspaceRepository.existsByOwnerIdAndSlug(1L, "new")).willReturn(false)
        given(projectRepository.findByOwnerIdAndRepositoryKey(1L, "alice/openlog"))
            .willReturn(existingProject)

        assertThatThrownBy {
            workspaceService.createWorkspace(
                owner,
                CreateWorkspaceRequest(slug = "new", name = "New", repoFullName = "Alice/OpenLog"),
            )
        }.isInstanceOf(BadRequestException::class.java)

        verify(workspaceRepository, never()).save(any(Workspace::class.java))
    }

    @Test
    // URL 식별자로 쓰기 어려운 slug 문자는 저장 전에 거부한다.
    fun `createWorkspace rejects invalid slug`() {
        val owner = User(id = 1L, username = "alice")

        assertThatThrownBy {
            workspaceService.createWorkspace(
                owner,
                CreateWorkspaceRequest(slug = "bad_slug", name = "Bad Slug"),
            )
        }.isInstanceOf(BadRequestException::class.java)

        verify(workspaceRepository, never()).save(any(Workspace::class.java))
    }

    @Test
    // 소유권 검사를 통과한 워크스페이스의 수정 가능 필드만 갱신하는지 검증한다.
    fun `updateWorkspace updates owned workspace`() {
        val owner = User(id = 1L, username = "alice")
        val workspace = Workspace(
            id = 10L,
            owner = owner,
            slug = "default",
            name = "Default",
        )
        given(workspaceAccessResolver.requireOwnedWorkspace(1L, 10L)).willReturn(workspace)
        given(projectRepository.findAllByWorkspaceIdOrderByUpdatedAtDescIdDesc(10L)).willReturn(emptyList())

        val response = workspaceService.updateWorkspace(
            userId = 1L,
            workspaceId = 10L,
            request = UpdateWorkspaceRequest(name = " Updated Workspace "),
        )

        assertThat(workspace.name).isEqualTo("Updated Workspace")
        assertThat(response.name).isEqualTo("Updated Workspace")
        assertThat(response.projects).isEmpty()
    }

    @Test
    // 소유권 검사를 통과한 워크스페이스만 삭제 repository로 넘기는지 검증한다.
    fun `deleteWorkspace deletes owned workspace`() {
        val owner = User(id = 1L, username = "alice")
        val workspace = Workspace(
            id = 10L,
            owner = owner,
            slug = "default",
            name = "Default",
        )
        given(workspaceAccessResolver.requireOwnedWorkspace(1L, 10L)).willReturn(workspace)

        workspaceService.deleteWorkspace(userId = 1L, workspaceId = 10L)

        verify(workspaceRepository).delete(workspace)
    }
}
