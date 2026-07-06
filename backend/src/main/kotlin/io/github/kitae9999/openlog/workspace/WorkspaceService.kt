package io.github.kitae9999.openlog.workspace

import io.github.kitae9999.openlog.common.exception.BadRequestException
import io.github.kitae9999.openlog.user.entity.User
import io.github.kitae9999.openlog.workspace.dto.CreateWorkspaceRequest
import io.github.kitae9999.openlog.workspace.dto.UpdateWorkspaceRequest
import io.github.kitae9999.openlog.workspace.dto.WorkspaceResponse
import io.github.kitae9999.openlog.workspace.entity.Workspace
import io.github.kitae9999.openlog.workspace.repository.WorkspaceRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class WorkspaceService(
    private val workspaceRepository: WorkspaceRepository,
    private val workspaceAccessResolver: WorkspaceAccessResolver,
) {
    @Transactional(readOnly = true)
    fun getWorkspaces(userId: Long): List<WorkspaceResponse> {
        return workspaceRepository.findAllByOwnerIdOrderByUpdatedAtDescIdDesc(userId)
            .map(::toResponse)
    }

    /**
     * 아직 안씀
     */
    @Transactional(readOnly = true)
    fun getWorkspace(userId: Long, workspaceId: Long): WorkspaceResponse {
        return toResponse(workspaceAccessResolver.requireOwnedWorkspace(userId, workspaceId))
    }

    @Transactional
    fun createWorkspace(user: User, request: CreateWorkspaceRequest): WorkspaceResponse {
        val ownerId = requireNotNull(user.id)
        val slug = normalizeSlug(request.slug)
        val name = request.name.trim()
        val repoFullName = request.repoFullName?.trim()?.takeIf { it.isNotEmpty() }

        if (!SLUG_PATTERN.matches(slug)) {
            throw BadRequestException("워크스페이스 slug는 영문 소문자, 숫자, 하이픈만 사용할 수 있습니다.")
        }
        if (workspaceRepository.existsByOwnerIdAndSlug(ownerId, slug)) {
            throw BadRequestException("이미 사용 중인 워크스페이스 slug입니다.")
        }

        val workspace = workspaceRepository.save(
            Workspace(
                owner = user,
                slug = slug,
                name = name,
                repoFullName = repoFullName,
            )
        )

        return toResponse(workspace)
    }

    @Transactional
    fun updateWorkspace(userId: Long, workspaceId: Long, request: UpdateWorkspaceRequest): WorkspaceResponse {
        val workspace = workspaceAccessResolver.requireOwnedWorkspace(userId, workspaceId)
        workspace.update(
            name = request.name.trim(),
            repoFullName = request.repoFullName?.trim()?.takeIf { it.isNotEmpty() },
        )

        return toResponse(workspace)
    }

    @Transactional
    fun deleteWorkspace(userId: Long, workspaceId: Long) {
        val workspace = workspaceAccessResolver.requireOwnedWorkspace(userId, workspaceId)
        workspaceRepository.delete(workspace)
    }

    private fun toResponse(workspace: Workspace): WorkspaceResponse {
        return WorkspaceResponse(
            id = requireNotNull(workspace.id),
            slug = workspace.slug,
            name = workspace.name,
            repoFullName = workspace.repoFullName,
            createdAt = workspace.createdAt.toString(),
            updatedAt = workspace.updatedAt.toString(),
        )
    }

    private fun normalizeSlug(value: String): String {
        return value.trim().lowercase()
    }

    private companion object {
        private val SLUG_PATTERN = Regex("[a-z0-9][a-z0-9-]{0,62}")
    }
}
