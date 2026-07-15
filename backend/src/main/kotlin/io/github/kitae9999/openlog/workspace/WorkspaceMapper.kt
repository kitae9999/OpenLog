package io.github.kitae9999.openlog.workspace

import io.github.kitae9999.openlog.common.resolveAuthorName
import io.github.kitae9999.openlog.workspace.dto.TaskAuthorResponse
import io.github.kitae9999.openlog.workspace.dto.TaskDetailResponse
import io.github.kitae9999.openlog.workspace.dto.TaskLinkResponse
import io.github.kitae9999.openlog.workspace.dto.WorkspaceLogDetailResponse
import io.github.kitae9999.openlog.workspace.dto.WorkspaceLogResponse
import io.github.kitae9999.openlog.workspace.dto.WorkspaceProjectResponse
import io.github.kitae9999.openlog.workspace.dto.WorkspaceResponse
import io.github.kitae9999.openlog.workspace.dto.WorkspaceTaskResponse
import io.github.kitae9999.openlog.workspace.entity.LogLink
import io.github.kitae9999.openlog.workspace.entity.LogLinkResponse
import io.github.kitae9999.openlog.workspace.entity.TaskLink
import io.github.kitae9999.openlog.workspace.entity.Workspace
import io.github.kitae9999.openlog.workspace.entity.WorkspaceLog
import io.github.kitae9999.openlog.workspace.entity.WorkspaceProject
import io.github.kitae9999.openlog.workspace.entity.WorkspaceTask
import org.springframework.stereotype.Component

@Component
class WorkspaceMapper {
    fun toWorkspaceResponse(
        workspace: Workspace,
        projects: List<WorkspaceProject> = emptyList(),
    ): WorkspaceResponse {
        return WorkspaceResponse(
            id = requireNotNull(workspace.id),
            slug = workspace.slug,
            name = workspace.name,
            projects = projects.map(::toWorkspaceProjectResponse),
            createdAt = workspace.createdAt.toString(),
            updatedAt = workspace.updatedAt.toString(),
        )
    }

    fun toWorkspaceProjectResponse(project: WorkspaceProject): WorkspaceProjectResponse {
        return WorkspaceProjectResponse(
            id = requireNotNull(project.id),
            workspaceId = requireNotNull(project.workspace.id),
            displayName = project.displayName,
            repositoryFullName = project.repositoryFullName,
            captureMode = project.captureMode,
            createdAt = project.createdAt.toString(),
            updatedAt = project.updatedAt.toString(),
        )
    }

    fun toLogResponse(log: WorkspaceLog): WorkspaceLogResponse {
        val author = log.author

        return WorkspaceLogResponse(
            id = requireNotNull(log.id),
            kind = log.kind,
            status = log.status,
            title = log.title,
            summary = log.summary,
            authorName = resolveAuthorName(author),
            authorProfileImageUrl = author.profileImageUrl,
            taskId = log.task?.id,
            createdAt = log.createdAt.toString(),
            updatedAt = log.updatedAt.toString(),
        )
    }

    fun toLogDetailResponse(log: WorkspaceLog): WorkspaceLogDetailResponse {
        val author = log.author

        return WorkspaceLogDetailResponse(
            id = requireNotNull(log.id),
            kind = log.kind,
            status = log.status,
            title = log.title,
            summary = log.summary,
            content = log.content,
            authorName = resolveAuthorName(author),
            authorProfileImageUrl = author.profileImageUrl,
            taskId = log.task?.id,
            createdAt = log.createdAt.toString(),
            updatedAt = log.updatedAt.toString(),
            closedAt = log.closedAt?.toString(),
        )
    }

    fun toTaskResponse(task: WorkspaceTask): WorkspaceTaskResponse {
        val author = task.author

        return WorkspaceTaskResponse(
            id = requireNotNull(task.id),
            title = task.title,
            description = task.description,
            content = task.content,
            status = task.status,
            authorName = resolveAuthorName(author),
            authorProfileImageUrl = author.profileImageUrl,
            createdAt = task.createdAt.toString(),
            updatedAt = task.updatedAt.toString(),
        )
    }

    fun toTaskDetailResponse(task: WorkspaceTask): TaskDetailResponse {
        val author = task.author

        return TaskDetailResponse(
            id = requireNotNull(task.id),
            title = task.title,
            description = task.description,
            content = task.content,
            status = task.status,
            author = TaskAuthorResponse(
                id = requireNotNull(author.id),
                username = author.username,
                nickname = author.nickname,
                profileImageUrl = author.profileImageUrl,
            ),
            createdAt = task.createdAt.toString(),
            updatedAt = task.updatedAt.toString(),
        )
    }

    fun toLogLinkResponse(link: LogLink): LogLinkResponse {
        return LogLinkResponse(
            id = requireNotNull(link.id),
            fromLog = toLogResponse(link.fromLog),
            toLog = toLogResponse(link.toLog),
            relation = link.relation,
        )
    }

    fun toTaskLinkResponse(link: TaskLink): TaskLinkResponse {
        return TaskLinkResponse(
            id = requireNotNull(link.id),
            fromTask = toTaskResponse(link.fromTask),
            toTask = toTaskResponse(link.toTask),
            relation = link.relation,
            createdAt = link.createdAt.toString(),
        )
    }
}
