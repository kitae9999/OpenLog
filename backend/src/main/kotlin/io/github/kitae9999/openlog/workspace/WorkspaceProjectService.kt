package io.github.kitae9999.openlog.workspace

import io.github.kitae9999.openlog.common.exception.BadRequestException
import io.github.kitae9999.openlog.common.exception.NotFoundException
import io.github.kitae9999.openlog.user.entity.User
import io.github.kitae9999.openlog.workspace.dto.CreateWorkspaceProjectRequest
import io.github.kitae9999.openlog.workspace.dto.UpdateWorkspaceProjectRequest
import io.github.kitae9999.openlog.workspace.dto.WorkspaceAgentContextResponse
import io.github.kitae9999.openlog.workspace.dto.WorkspaceProjectResponse
import io.github.kitae9999.openlog.workspace.entity.WorkspaceProject
import io.github.kitae9999.openlog.workspace.repository.WorkspaceProjectRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class WorkspaceProjectService(
    private val projectRepository: WorkspaceProjectRepository,
    private val workspaceAccessResolver: WorkspaceAccessResolver,
    private val workspaceMapper: WorkspaceMapper,
    private val guideService: WorkspaceAgentGuideService,
) {
    @Transactional(readOnly = true)
    fun listProjects(userId: Long, workspaceId: Long): List<WorkspaceProjectResponse> {
        workspaceAccessResolver.requireOwnedWorkspace(userId, workspaceId)
        return projectRepository.findAllByWorkspaceIdOrderByUpdatedAtDescIdDesc(workspaceId)
            .map(workspaceMapper::toWorkspaceProjectResponse)
    }

    @Transactional
    fun createProject(
        user: User,
        workspaceId: Long,
        request: CreateWorkspaceProjectRequest,
    ): WorkspaceProjectResponse {
        val ownerId = requireNotNull(user.id)
        val workspace = workspaceAccessResolver.requireOwnedWorkspace(ownerId, workspaceId)
        val repository = normalizeRepository(request.repositoryFullName)
        requireRepositoryAvailable(ownerId, repository?.key, null)

        val project = projectRepository.save(
            WorkspaceProject(
                owner = user,
                workspace = workspace,
                displayName = request.displayName.trim(),
                repositoryFullName = repository?.fullName,
                repositoryKey = repository?.key,
                captureMode = request.captureMode,
            )
        )
        return workspaceMapper.toWorkspaceProjectResponse(project)
    }

    @Transactional(readOnly = true)
    fun getProject(userId: Long, projectId: Long): WorkspaceProjectResponse {
        return workspaceMapper.toWorkspaceProjectResponse(requireOwnedProject(userId, projectId))
    }

    @Transactional(readOnly = true)
    fun resolveProject(userId: Long, repositoryFullName: String): WorkspaceProjectResponse {
        val repository = requireNotNull(normalizeRepository(repositoryFullName))
        val project = projectRepository.findByOwnerIdAndRepositoryKey(userId, repository.key)
            ?: throw NotFoundException("연결된 OpenLog 프로젝트를 찾을 수 없습니다.")
        return workspaceMapper.toWorkspaceProjectResponse(project)
    }

    @Transactional(readOnly = true)
    fun getAgentContext(userId: Long, projectId: Long): WorkspaceAgentContextResponse {
        val project = requireOwnedProject(userId, projectId)
        val workspace = project.workspace
        val workspaceProjects = projectRepository.findAllByWorkspaceIdOrderByUpdatedAtDescIdDesc(
            requireNotNull(workspace.id)
        )
        val guide = guideService.requireGuide(requireNotNull(workspace.id))

        return WorkspaceAgentContextResponse(
            workspace = workspaceMapper.toWorkspaceResponse(workspace, workspaceProjects),
            project = workspaceMapper.toWorkspaceProjectResponse(project),
            guide = guideService.toResponse(guide),
        )
    }

    @Transactional
    fun updateProject(
        userId: Long,
        projectId: Long,
        request: UpdateWorkspaceProjectRequest,
    ): WorkspaceProjectResponse {
        val project = requireOwnedProject(userId, projectId)
        val workspace = workspaceAccessResolver.requireOwnedWorkspace(userId, request.workspaceId)
        val repository = normalizeRepository(request.repositoryFullName)
        requireRepositoryAvailable(userId, repository?.key, projectId)
        project.update(
            workspace = workspace,
            displayName = request.displayName.trim(),
            repositoryFullName = repository?.fullName,
            repositoryKey = repository?.key,
            captureMode = request.captureMode,
        )
        return workspaceMapper.toWorkspaceProjectResponse(project)
    }

    @Transactional
    fun deleteProject(userId: Long, projectId: Long) {
        projectRepository.delete(requireOwnedProject(userId, projectId))
    }

    private fun requireOwnedProject(userId: Long, projectId: Long): WorkspaceProject {
        return projectRepository.findByIdAndOwnerId(projectId, userId)
            ?: throw NotFoundException("OpenLog 프로젝트 연결을 찾을 수 없습니다.")
    }

    private fun requireRepositoryAvailable(userId: Long, repositoryKey: String?, projectId: Long?) {
        if (repositoryKey == null) {
            return
        }

        val exists = if (projectId == null) {
            projectRepository.findByOwnerIdAndRepositoryKey(userId, repositoryKey) != null
        } else {
            projectRepository.existsByOwnerIdAndRepositoryKeyAndIdNot(userId, repositoryKey, projectId)
        }
        if (exists) {
            throw BadRequestException("이 GitHub 저장소는 이미 다른 OpenLog 프로젝트에 연결되어 있습니다.")
        }
    }

    private fun normalizeRepository(value: String?): NormalizedRepository? {
        val trimmed = value?.trim()?.removeSuffix(".git")?.takeIf(String::isNotEmpty) ?: return null
        if (!REPOSITORY_PATTERN.matches(trimmed)) {
            throw BadRequestException("GitHub 저장소는 owner/repository 형식이어야 합니다.")
        }
        return NormalizedRepository(fullName = trimmed, key = trimmed.lowercase())
    }

    private data class NormalizedRepository(
        val fullName: String,
        val key: String,
    )

    private companion object {
        private val REPOSITORY_PATTERN = Regex("[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+")
    }
}
