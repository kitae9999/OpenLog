package io.github.kitae9999.openlog.workspace.dto

import io.github.kitae9999.openlog.workspace.entity.WorkspaceCaptureMode
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Positive
import jakarta.validation.constraints.Size

data class WorkspaceProjectResponse(
    val id: Long,
    val workspaceId: Long,
    val displayName: String,
    val repositoryFullName: String?,
    val captureMode: WorkspaceCaptureMode,
    val createdAt: String,
    val updatedAt: String,
)

data class CreateWorkspaceProjectRequest(
    @field:NotBlank(message = "프로젝트 이름은 필수입니다.")
    @field:Size(max = 255, message = "프로젝트 이름은 255자 이하여야 합니다.")
    val displayName: String,
    @field:Size(max = 255, message = "GitHub 저장소는 255자 이하여야 합니다.")
    val repositoryFullName: String? = null,
    val captureMode: WorkspaceCaptureMode = WorkspaceCaptureMode.ASK,
)

data class UpdateWorkspaceProjectRequest(
    @field:NotNull(message = "워크스페이스 ID는 필수입니다.")
    @field:Positive(message = "워크스페이스 ID는 양수여야 합니다.")
    val workspaceId: Long,
    @field:NotBlank(message = "프로젝트 이름은 필수입니다.")
    @field:Size(max = 255, message = "프로젝트 이름은 255자 이하여야 합니다.")
    val displayName: String,
    @field:Size(max = 255, message = "GitHub 저장소는 255자 이하여야 합니다.")
    val repositoryFullName: String? = null,
    val captureMode: WorkspaceCaptureMode,
)

data class WorkspaceAgentContextResponse(
    val workspace: WorkspaceResponse,
    val project: WorkspaceProjectResponse,
    val guide: WorkspaceAgentGuideResponse,
)
