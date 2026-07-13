package io.github.kitae9999.openlog.workspace

import io.github.kitae9999.openlog.common.exception.BadRequestException
import io.github.kitae9999.openlog.common.exception.ForbiddenException
import io.github.kitae9999.openlog.common.exception.NotFoundException
import io.github.kitae9999.openlog.memory.entity.WorkspaceMemory
import io.github.kitae9999.openlog.memory.repository.WorkspaceMemoryRepository
import io.github.kitae9999.openlog.workspace.entity.Workspace
import io.github.kitae9999.openlog.workspace.entity.WorkspaceLog
import io.github.kitae9999.openlog.workspace.entity.WorkspaceTask
import io.github.kitae9999.openlog.workspace.repository.WorkspaceLogRepository
import io.github.kitae9999.openlog.workspace.repository.WorkspaceRepository
import io.github.kitae9999.openlog.workspace.repository.WorkspaceTaskRepository
import org.springframework.stereotype.Component
import kotlin.jvm.optionals.getOrNull

@Component
class WorkspaceAccessResolver(
    private val workspaceRepository: WorkspaceRepository,
    private val workspaceTaskRepository: WorkspaceTaskRepository,
    private val workspaceLogRepository: WorkspaceLogRepository,
    private val workspaceMemoryRepository: WorkspaceMemoryRepository,
) {
    /**
     * workspace가 사용자 소유인지 검증
     */
    fun requireOwnedWorkspace(userId: Long, workspaceId: Long): Workspace {
        val workspace = workspaceRepository.findById(workspaceId).getOrNull()
            ?: throw NotFoundException("워크스페이스를 찾을 수 없습니다.")

        if (workspace.owner.id != userId) {
            throw ForbiddenException("권한이 없는 요청입니다.")
        }

        return workspace
    }

    /**
     * task가 workspace에 속하는지 검증
     */
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

    /**
     * log가 workspace에 속하는지 검증
     */
    fun requireOwnedLog(workspace: Workspace, logId: Long): WorkspaceLog {
        val log = workspaceLogRepository.findById(logId).getOrNull()
            ?: throw NotFoundException("로그를 찾을 수 없습니다.")

        if (log.workspace.id != workspace.id) {
            throw BadRequestException("현재 워크스페이스에 속한 로그만 사용할 수 있습니다.")
        }

        return log
    }

    fun requireOwnedMemory(workspace: Workspace, memoryId: Long): WorkspaceMemory {
        val memory = workspaceMemoryRepository.findById(memoryId).getOrNull()
            ?: throw NotFoundException("Memory를 찾을 수 없습니다.")

        if (memory.workspace.id != workspace.id) {
            throw BadRequestException("현재 워크스페이스에 속한 Memory만 사용할 수 있습니다.")
        }

        return memory
    }
}
