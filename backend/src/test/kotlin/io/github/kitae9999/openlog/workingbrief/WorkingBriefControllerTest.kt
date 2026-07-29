package io.github.kitae9999.openlog.workingbrief

import io.github.kitae9999.openlog.user.entity.User
import io.github.kitae9999.openlog.workingbrief.dto.WorkingBriefResponse
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.BDDMockito.given
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.springframework.http.HttpStatus

@ExtendWith(MockitoExtension::class)
class WorkingBriefControllerTest {
    @Mock private lateinit var workingBriefService: WorkingBriefService
    private lateinit var controller: WorkingBriefController
    private lateinit var user: User

    @BeforeEach
    fun setUp() {
        controller = WorkingBriefController(workingBriefService)
        user = User(id = 1L, username = "alice")
    }

    @Test
    fun `getBrief returns not found when the optional brief is missing`() {
        given(workingBriefService.findBrief(1L, 10L)).willReturn(null)

        val response = controller.getBrief(user, 10L)

        assertThat(response.statusCode).isEqualTo(HttpStatus.NOT_FOUND)
        assertThat(response.body).isNull()
    }

    @Test
    fun `getBrief returns the existing brief`() {
        val brief = WorkingBriefResponse(
            title = "Current focus",
            prose = "Fix the dashboard.",
            taskId = null,
            taskTitle = null,
            branch = "fix/dashboard",
            updatedAt = "2026-07-30T00:00:00",
        )
        given(workingBriefService.findBrief(1L, 10L)).willReturn(brief)

        val response = controller.getBrief(user, 10L)

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(response.body).isEqualTo(brief)
    }
}
