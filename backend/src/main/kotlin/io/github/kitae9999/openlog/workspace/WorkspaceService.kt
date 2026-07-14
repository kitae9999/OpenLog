package io.github.kitae9999.openlog.workspace

import io.github.kitae9999.openlog.common.exception.BadRequestException
import io.github.kitae9999.openlog.user.entity.User
import io.github.kitae9999.openlog.workspace.dto.CreateWorkspaceRequest
import io.github.kitae9999.openlog.workspace.dto.UpdateWorkspaceRequest
import io.github.kitae9999.openlog.workspace.dto.WorkspaceResponse
import io.github.kitae9999.openlog.workspace.entity.Workspace
import io.github.kitae9999.openlog.workspace.entity.WorkspaceAgentGuide
import io.github.kitae9999.openlog.workspace.entity.WorkspaceCaptureMode
import io.github.kitae9999.openlog.workspace.entity.WorkspaceProject
import io.github.kitae9999.openlog.workspace.repository.WorkspaceAgentGuideRepository
import io.github.kitae9999.openlog.workspace.repository.WorkspaceProjectRepository
import io.github.kitae9999.openlog.workspace.repository.WorkspaceRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class WorkspaceService(
    private val workspaceRepository: WorkspaceRepository,
    private val guideRepository: WorkspaceAgentGuideRepository,
    private val projectRepository: WorkspaceProjectRepository,
    private val workspaceAccessResolver: WorkspaceAccessResolver,
    private val workspaceMapper: WorkspaceMapper,
) {
    @Transactional(readOnly = true)
    fun getWorkspaces(userId: Long): List<WorkspaceResponse> {
        val projectsByWorkspaceId = projectRepository.findAllByOwnerIdOrderByUpdatedAtDescIdDesc(userId)
            .groupBy { requireNotNull(it.workspace.id) }
        return workspaceRepository.findAllByOwnerIdOrderByUpdatedAtDescIdDesc(userId)
            .map { workspace ->
                workspaceMapper.toWorkspaceResponse(
                    workspace,
                    projectsByWorkspaceId[requireNotNull(workspace.id)].orEmpty(),
                )
            }
    }

    /**
     * 아직 안씀
     */
    @Transactional(readOnly = true)
    fun getWorkspace(userId: Long, workspaceId: Long): WorkspaceResponse {
        val workspace = workspaceAccessResolver.requireOwnedWorkspace(userId, workspaceId)
        val projects = projectRepository.findAllByWorkspaceIdOrderByUpdatedAtDescIdDesc(workspaceId)
        return workspaceMapper.toWorkspaceResponse(workspace, projects)
    }

    @Transactional
    fun createWorkspace(user: User, request: CreateWorkspaceRequest): WorkspaceResponse {
        val ownerId = requireNotNull(user.id)
        val slug = normalizeSlug(request.slug)
        val name = request.name.trim()
        val repoFullName = normalizeRepository(request.repoFullName)

        if (!SLUG_PATTERN.matches(slug)) {
            throw BadRequestException("워크스페이스 slug는 영문 소문자, 숫자, 하이픈만 사용할 수 있습니다.")
        }
        if (workspaceRepository.existsByOwnerIdAndSlug(ownerId, slug)) {
            throw BadRequestException("이미 사용 중인 워크스페이스 slug입니다.")
        }
        if (
            repoFullName != null &&
            projectRepository.findByOwnerIdAndRepositoryKey(ownerId, repoFullName.lowercase()) != null
        ) {
            throw BadRequestException("이 GitHub 저장소는 이미 다른 OpenLog 프로젝트에 연결되어 있습니다.")
        }

        val workspace = workspaceRepository.save(
            Workspace(
                owner = user,
                slug = slug,
                name = name,
            )
        )

        guideRepository.save(
            WorkspaceAgentGuide(
                workspace = workspace,
                content = DefaultWorkspaceAgentGuide.CONTENT,
            )
        )

        val projects = if (repoFullName == null) {
            emptyList()
        } else {
            listOf(
                projectRepository.save(
                    WorkspaceProject(
                        owner = user,
                        workspace = workspace,
                        displayName = repoFullName,
                        repositoryFullName = repoFullName,
                        repositoryKey = repoFullName.lowercase(),
                        captureMode = WorkspaceCaptureMode.ASK,
                    )
                )
            )
        }

        return workspaceMapper.toWorkspaceResponse(workspace, projects)
    }

    @Transactional
    fun updateWorkspace(userId: Long, workspaceId: Long, request: UpdateWorkspaceRequest): WorkspaceResponse {
        val workspace = workspaceAccessResolver.requireOwnedWorkspace(userId, workspaceId)
        workspace.update(name = request.name.trim())

        return workspaceMapper.toWorkspaceResponse(
            workspace,
            projectRepository.findAllByWorkspaceIdOrderByUpdatedAtDescIdDesc(workspaceId),
        )
    }

    @Transactional
    fun deleteWorkspace(userId: Long, workspaceId: Long) {
        val workspace = workspaceAccessResolver.requireOwnedWorkspace(userId, workspaceId)
        workspaceRepository.delete(workspace)
    }

    private fun normalizeSlug(value: String): String {
        return value.trim().lowercase()
    }

    private fun normalizeRepository(value: String?): String? {
        val repository = value?.trim()?.removeSuffix(".git")?.takeIf(String::isNotEmpty) ?: return null
        if (!REPOSITORY_PATTERN.matches(repository)) {
            throw BadRequestException("GitHub 저장소는 owner/repository 형식이어야 합니다.")
        }
        return repository
    }

    private companion object {
        private val SLUG_PATTERN = Regex("[a-z0-9][a-z0-9-]{0,62}")
        private val REPOSITORY_PATTERN = Regex("[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+")
    }
}
