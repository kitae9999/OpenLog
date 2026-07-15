package io.github.kitae9999.openlog.workspace

import io.github.kitae9999.openlog.user.entity.User
import io.github.kitae9999.openlog.workspace.dto.UpdateWorkspaceAgentGuideRequest
import io.github.kitae9999.openlog.workspace.entity.Workspace
import io.github.kitae9999.openlog.workspace.entity.WorkspaceAgentGuide
import io.github.kitae9999.openlog.workspace.repository.WorkspaceAgentGuideRepository
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.BDDMockito.given
import org.mockito.Mock
import org.mockito.Mockito.verify
import org.mockito.junit.jupiter.MockitoExtension
import org.springframework.test.util.ReflectionTestUtils
import java.util.Optional

@ExtendWith(MockitoExtension::class)
class WorkspaceAgentGuideServiceTest {
    @Mock
    private lateinit var guideRepository: WorkspaceAgentGuideRepository

    @Mock
    private lateinit var workspaceAccessResolver: WorkspaceAccessResolver

    private lateinit var guideService: WorkspaceAgentGuideService

    @BeforeEach
    fun setUp() {
        guideService = WorkspaceAgentGuideService(guideRepository, workspaceAccessResolver)
    }

    @Test
    fun `updateGuide increments revision only when content changes`() {
        val owner = User(id = 1L, username = "alice")
        val workspace = Workspace(id = 10L, owner = owner, slug = "default", name = "Default")
        val guide = WorkspaceAgentGuide(workspace, "Initial guide")
        ReflectionTestUtils.setField(guide, "workspaceId", 10L)
        given(workspaceAccessResolver.requireOwnedWorkspace(1L, 10L)).willReturn(workspace)
        given(guideRepository.findById(10L)).willReturn(Optional.of(guide))

        val changed = guideService.updateGuide(
            userId = 1L,
            workspaceId = 10L,
            request = UpdateWorkspaceAgentGuideRequest("  Updated guide  "),
        )
        val unchanged = guideService.updateGuide(
            userId = 1L,
            workspaceId = 10L,
            request = UpdateWorkspaceAgentGuideRequest("Updated guide"),
        )

        assertThat(changed.content).isEqualTo("Updated guide")
        assertThat(changed.revision).isEqualTo(2L)
        assertThat(unchanged.revision).isEqualTo(2L)
        verify(workspaceAccessResolver, org.mockito.Mockito.times(2)).requireOwnedWorkspace(1L, 10L)
    }
}
