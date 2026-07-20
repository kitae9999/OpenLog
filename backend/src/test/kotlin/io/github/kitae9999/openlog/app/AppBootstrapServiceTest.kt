package io.github.kitae9999.openlog.app

import io.github.kitae9999.openlog.notification.NotificationService
import io.github.kitae9999.openlog.notification.dto.NotificationSummaryResponse
import io.github.kitae9999.openlog.user.entity.User
import io.github.kitae9999.openlog.workspace.WorkspaceNavigationSummaryService
import io.github.kitae9999.openlog.workspace.WorkspaceService
import io.github.kitae9999.openlog.workspace.dto.WorkspaceNavigationSummaryResponse
import io.github.kitae9999.openlog.workspace.dto.WorkspaceResponse
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.BDDMockito.given
import org.mockito.Mock
import org.mockito.Mockito.verify
import org.mockito.junit.jupiter.MockitoExtension

@ExtendWith(MockitoExtension::class)
class AppBootstrapServiceTest {
    @Mock private lateinit var workspaceService: WorkspaceService
    @Mock private lateinit var workspaceNavigationSummaryService: WorkspaceNavigationSummaryService
    @Mock private lateinit var notificationService: NotificationService
    private lateinit var service: AppBootstrapService

    @BeforeEach
    fun setUp() {
        service = AppBootstrapService(
            workspaceService,
            workspaceNavigationSummaryService,
            notificationService,
        )
    }

    @Test
    fun `bootstrap falls back to the first owned workspace and combines common state`() {
        val user = User(id = 1L, username = "ash", nickname = "ASH")
        val firstWorkspace = workspace(10L, "first")
        val secondWorkspace = workspace(20L, "second")
        val navigationSummary = WorkspaceNavigationSummaryResponse(2, 7, 1)
        given(workspaceService.getWorkspaces(1L)).willReturn(listOf(firstWorkspace, secondWorkspace))
        given(workspaceNavigationSummaryService.getSummary(1L, 10L)).willReturn(navigationSummary)
        given(notificationService.getSummary(1L)).willReturn(NotificationSummaryResponse(3))

        val response = service.getBootstrap(user, 999L)

        assertThat(response.user.username).isEqualTo("ash")
        assertThat(response.activeWorkspaceId).isEqualTo(10L)
        assertThat(response.navigationSummary).isEqualTo(navigationSummary)
        assertThat(response.notificationSummary.unreadCount).isEqualTo(3)
        verify(workspaceNavigationSummaryService).getSummary(1L, 10L)
    }

    @Test
    fun `bootstrap returns nullable workspace state when the user owns no workspace`() {
        val user = User(id = 1L, username = "ash", nickname = "ASH")
        given(workspaceService.getWorkspaces(1L)).willReturn(emptyList())
        given(notificationService.getSummary(1L)).willReturn(NotificationSummaryResponse(0))

        val response = service.getBootstrap(user, null)

        assertThat(response.workspaces).isEmpty()
        assertThat(response.activeWorkspaceId).isNull()
        assertThat(response.navigationSummary).isNull()
    }

    private fun workspace(id: Long, slug: String): WorkspaceResponse {
        return WorkspaceResponse(
            id = id,
            slug = slug,
            name = slug,
            projects = emptyList(),
            createdAt = "2026-07-20T00:00:00",
            updatedAt = "2026-07-20T00:00:00",
        )
    }
}
