package io.github.kitae9999.openlog.workspace

import io.github.kitae9999.openlog.workspace.repository.LogLinkRepository
import io.github.kitae9999.openlog.workspace.repository.TaskLinkRepository
import org.springframework.stereotype.Service

@Service
class WorkspaceLinkService (
    private val logLinkRepository: LogLinkRepository,
    private val taskLinkRepository: TaskLinkRepository,
    private val workspaceAccessResolver: WorkspaceAccessResolver,
) {
}