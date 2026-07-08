package io.github.kitae9999.openlog.output.entity

import io.github.kitae9999.openlog.user.entity.User
import io.github.kitae9999.openlog.workspace.entity.Workspace
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull

class WorkspaceOutputTest {
    private val user = User(username = "kitae", nickname = "kitae")
    private val workspace = Workspace(owner = user, slug = "default", name = "Default")

    @Test
    fun `post draft output can be published`() {
        val output = WorkspaceOutput(
            workspace = workspace,
            author = user,
            title = "Migration notes",
            content = "What changed and why.",
        )

        output.markPublished()

        assertEquals(OutputStatus.PUBLISHED, output.status)
        assertNotNull(output.publishedAt)
    }

    @Test
    fun `output can be archived`() {
        val output = WorkspaceOutput(
            workspace = workspace,
            author = user,
            title = "Draft",
            content = "Draft content.",
        )

        output.archive()

        assertEquals(OutputStatus.ARCHIVED, output.status)
    }
}
