package io.github.kitae9999.openlog.workspace

import io.github.kitae9999.openlog.common.exception.NotFoundException
import io.github.kitae9999.openlog.workspace.dto.UpdateWorkspaceAgentGuideRequest
import io.github.kitae9999.openlog.workspace.dto.WorkspaceAgentGuideResponse
import io.github.kitae9999.openlog.workspace.entity.WorkspaceAgentGuide
import io.github.kitae9999.openlog.workspace.repository.WorkspaceAgentGuideRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class WorkspaceAgentGuideService(
    private val guideRepository: WorkspaceAgentGuideRepository,
    private val workspaceAccessResolver: WorkspaceAccessResolver,
) {
    @Transactional(readOnly = true)
    fun getGuide(userId: Long, workspaceId: Long): WorkspaceAgentGuideResponse {
        workspaceAccessResolver.requireOwnedWorkspace(userId, workspaceId)
        return toResponse(requireGuide(workspaceId))
    }

    @Transactional
    fun updateGuide(
        userId: Long,
        workspaceId: Long,
        request: UpdateWorkspaceAgentGuideRequest,
    ): WorkspaceAgentGuideResponse {
        workspaceAccessResolver.requireOwnedWorkspace(userId, workspaceId)
        val guide = requireGuide(workspaceId)
        guide.update(request.content.trim())
        return toResponse(guide)
    }

    fun requireGuide(workspaceId: Long): WorkspaceAgentGuide {
        return guideRepository.findById(workspaceId).orElseThrow {
            NotFoundException("Agent Guide를 찾을 수 없습니다.")
        }
    }

    fun toResponse(guide: WorkspaceAgentGuide): WorkspaceAgentGuideResponse {
        return WorkspaceAgentGuideResponse(
            workspaceId = requireNotNull(guide.workspaceId),
            content = guide.content,
            revision = guide.revision,
            createdAt = guide.createdAt.toString(),
            updatedAt = guide.updatedAt.toString(),
        )
    }
}
