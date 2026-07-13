package io.github.kitae9999.openlog.workspace

import io.github.kitae9999.openlog.common.exception.BadRequestException
import io.github.kitae9999.openlog.user.entity.User
import io.github.kitae9999.openlog.workspace.dto.CreateWorkspaceRequest
import io.github.kitae9999.openlog.workspace.dto.UpdateWorkspaceRequest
import io.github.kitae9999.openlog.workspace.entity.Workspace
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
    private lateinit var workspaceAccessResolver: WorkspaceAccessResolver

    private lateinit var workspaceService: WorkspaceService

    @BeforeEach
    fun setUp() {
        workspaceService = WorkspaceService(
            workspaceRepository = workspaceRepository,
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
            repoFullName = "alice/openlog",
        )
        given(workspaceRepository.findAllByOwnerIdOrderByUpdatedAtDescIdDesc(1L))
            .willReturn(listOf(workspace))

        val response = workspaceService.getWorkspaces(1L)

        assertThat(response).hasSize(1)
        assertThat(response.single().id).isEqualTo(10L)
        assertThat(response.single().slug).isEqualTo("default")
        assertThat(response.single().name).isEqualTo("Default Workspace")
        assertThat(response.single().repoFullName).isEqualTo("alice/openlog")
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
                repoFullName = workspace.repoFullName,
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
        verify(workspaceRepository).save(workspaceCaptor.capture())
        assertThat(workspaceCaptor.value.owner).isSameAs(owner)
        assertThat(workspaceCaptor.value.slug).isEqualTo("team-space")
        assertThat(workspaceCaptor.value.name).isEqualTo("Team Space")
        assertThat(workspaceCaptor.value.repoFullName).isEqualTo("alice/openlog")
        assertThat(response.id).isEqualTo(10L)
        assertThat(response.slug).isEqualTo("team-space")
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
            repoFullName = null,
        )
        given(workspaceAccessResolver.requireOwnedWorkspace(1L, 10L)).willReturn(workspace)

        val response = workspaceService.updateWorkspace(
            userId = 1L,
            workspaceId = 10L,
            request = UpdateWorkspaceRequest(
                name = " Updated Workspace ",
                repoFullName = " alice/openlog ",
            ),
        )

        assertThat(workspace.name).isEqualTo("Updated Workspace")
        assertThat(workspace.repoFullName).isEqualTo("alice/openlog")
        assertThat(response.name).isEqualTo("Updated Workspace")
        assertThat(response.repoFullName).isEqualTo("alice/openlog")
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
