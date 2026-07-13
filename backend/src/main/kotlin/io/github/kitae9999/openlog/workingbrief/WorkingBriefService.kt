package io.github.kitae9999.openlog.workingbrief

import io.github.kitae9999.openlog.common.exception.NotFoundException
import io.github.kitae9999.openlog.user.entity.User
import io.github.kitae9999.openlog.workingbrief.dto.UpsertWorkingBriefRequest
import io.github.kitae9999.openlog.workingbrief.dto.WorkingBriefResponse
import io.github.kitae9999.openlog.workingbrief.entity.WorkspaceWorkingBrief
import io.github.kitae9999.openlog.workingbrief.repository.WorkspaceWorkingBriefRepository
import io.github.kitae9999.openlog.workspace.WorkspaceAccessResolver
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class WorkingBriefService(
    private val workingBriefRepository: WorkspaceWorkingBriefRepository,
    private val workspaceAccessResolver: WorkspaceAccessResolver,
    private val workingBriefMapper: WorkingBriefMapper,
) {
    @Transactional(readOnly = true)
    fun getBrief(userId: Long, workspaceId: Long): WorkingBriefResponse {
        workspaceAccessResolver.requireOwnedWorkspace(userId, workspaceId)
        val brief = workingBriefRepository.findByWorkspaceId(workspaceId)
            ?: throw NotFoundException("Working brief를 찾을 수 없습니다.")
        return workingBriefMapper.toResponse(brief)
    }

    @Transactional
    fun upsertBrief(
        user: User,
        workspaceId: Long,
        request: UpsertWorkingBriefRequest,
    ): WorkingBriefResponse {
        val workspace = workspaceAccessResolver.requireOwnedWorkspace(requireNotNull(user.id), workspaceId)
        val task = workspaceAccessResolver.resolveTask(workspace, request.taskId)
        val title = request.title.trim()
        val prose = request.prose.trim()
        val branch = request.branch?.trim()?.takeIf { it.isNotEmpty() }

        val existing = workingBriefRepository.findByWorkspaceId(workspaceId)
        val brief = if (existing != null) {
            existing.update(user, title, prose, task, branch)
            existing
        } else {
            workingBriefRepository.save(
                WorkspaceWorkingBrief(
                    workspace = workspace,
                    author = user,
                    task = task,
                    title = title,
                    prose = prose,
                    branch = branch,
                ),
            )
        }

        return workingBriefMapper.toResponse(brief)
    }

    @Transactional
    fun clearBrief(userId: Long, workspaceId: Long) {
        workspaceAccessResolver.requireOwnedWorkspace(userId, workspaceId)
        val brief = workingBriefRepository.findByWorkspaceId(workspaceId)
            ?: return
        workingBriefRepository.delete(brief)
    }
}
