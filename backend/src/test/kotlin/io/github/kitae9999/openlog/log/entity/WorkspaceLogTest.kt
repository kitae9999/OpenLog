package io.github.kitae9999.openlog.log.entity

import io.github.kitae9999.openlog.user.entity.User
import io.github.kitae9999.openlog.workspace.entity.Workspace
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertNotNull
import kotlin.test.assertNull

class WorkspaceLogTest {
    private val user = User(username = "kitae", nickname = "kitae")
    private val workspace = Workspace(owner = user, slug = "default", name = "Default")

    @Test
    fun `issue log must be open or closed`() {
        val issue = WorkspaceLog(
            workspace = workspace,
            author = user,
            kind = LogKind.ISSUE,
            status = LogStatus.OPEN,
            title = "Build fails",
            content = "Turbopack cannot resolve the root.",
        )

        issue.closeIssue()

        assertEquals(LogStatus.CLOSED, issue.status)
        assertNotNull(issue.closedAt)
    }

    @Test
    fun `issue log rejects none status`() {
        assertFailsWith<IllegalArgumentException> {
            WorkspaceLog(
                workspace = workspace,
                author = user,
                kind = LogKind.ISSUE,
                status = LogStatus.NONE,
                title = "Build fails",
                content = "Turbopack cannot resolve the root.",
            )
        }
    }

    @Test
    fun `note log uses none status`() {
        val note = WorkspaceLog(
            workspace = workspace,
            author = user,
            kind = LogKind.NOTE,
            title = "Context",
            content = "General session note.",
        )

        assertEquals(LogStatus.NONE, note.status)
        assertNull(note.closedAt)
    }

    @Test
    fun `non issue log rejects open status`() {
        assertFailsWith<IllegalArgumentException> {
            WorkspaceLog(
                workspace = workspace,
                author = user,
                kind = LogKind.FIX,
                status = LogStatus.OPEN,
                title = "Fix build",
                content = "Set the root explicitly.",
            )
        }
    }
}
