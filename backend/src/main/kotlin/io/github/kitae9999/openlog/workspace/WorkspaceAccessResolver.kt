package io.github.kitae9999.openlog.workspace

import io.github.kitae9999.openlog.common.exception.BadRequestException
import io.github.kitae9999.openlog.common.exception.ForbiddenException
import io.github.kitae9999.openlog.common.exception.NotFoundException
import io.github.kitae9999.openlog.workspace.entity.WorkspaceTask
import io.github.kitae9999.openlog.workspace.repository.WorkspaceTaskRepository
import io.github.kitae9999.openlog.workspace.entity.Workspace
import io.github.kitae9999.openlog.workspace.repository.WorkspaceRepository
import org.springframework.stereotype.Component
import kotlin.jvm.optionals.getOrNull

@Component
class WorkspaceAccessResolver(
    private val workspaceRepository: WorkspaceRepository,
    private val workspaceTaskRepository: WorkspaceTaskRepository,
) {
    fun requireOwnedWorkspace(userId: Long, workspaceId: Long): Workspace {
        val workspace = workspaceRepository.findById(workspaceId).getOrNull()
            ?: throw NotFoundException("워크스페이스를 찾을 수 없습니다.")

        if (workspace.owner.id != userId) {
            throw ForbiddenException("권한이 없는 요청입니다.")
        }

        return workspace
    }

    fun resolveTask(workspace: Workspace, taskId: Long?): WorkspaceTask? {
        if (taskId == null) {
            return null
        }

        return requireOwnedTask(workspace, taskId)
    }

    fun requireOwnedTask(workspace: Workspace, taskId: Long): WorkspaceTask {
        val task = workspaceTaskRepository.findById(taskId).getOrNull()
            ?: throw NotFoundException("태스크를 찾을 수 없습니다.")

        if (task.workspace.id != workspace.id) {
            throw BadRequestException("현재 워크스페이스에 속한 태스크만 연결할 수 있습니다.")
        }

        return task
    }
}
