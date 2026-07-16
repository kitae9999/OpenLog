package io.github.kitae9999.openlog.output

import io.github.kitae9999.openlog.common.resolveAuthorName
import io.github.kitae9999.openlog.output.dto.OutputDetailResponse
import io.github.kitae9999.openlog.output.dto.OutputLogSourceResponse
import io.github.kitae9999.openlog.output.dto.OutputResponse
import io.github.kitae9999.openlog.output.dto.OutputTaskSourceResponse
import io.github.kitae9999.openlog.output.dto.LinkedOutputPostResponse
import io.github.kitae9999.openlog.output.entity.OutputLog
import io.github.kitae9999.openlog.output.entity.OutputTask
import io.github.kitae9999.openlog.output.entity.WorkspaceOutput
import io.github.kitae9999.openlog.post.entity.Post
import org.springframework.stereotype.Component

@Component
class OutputMapper {
    fun toOutputResponse(
        output: WorkspaceOutput,
        taskIds: List<Long>,
        logIds: List<Long>,
    ): OutputResponse {
        return OutputResponse(
            id = requireNotNull(output.id),
            status = output.status,
            title = output.title,
            authorName = resolveAuthorName(output.author),
            taskCount = taskIds.size,
            logCount = logIds.size,
            taskIds = taskIds,
            logIds = logIds,
            createdAt = output.createdAt.toString(),
            updatedAt = output.updatedAt.toString(),
            exportedAt = output.exportedAt?.toString(),
        )
    }

    fun toDetailResponse(
        output: WorkspaceOutput,
        tasks: List<OutputTask>,
        logs: List<OutputLog>,
        linkedPost: Post?,
    ): OutputDetailResponse {
        return OutputDetailResponse(
            id = requireNotNull(output.id),
            status = output.status,
            title = output.title,
            content = output.content,
            authorName = resolveAuthorName(output.author),
            tasks = tasks.map { link ->
                OutputTaskSourceResponse(
                    id = requireNotNull(link.task.id),
                    title = link.task.title,
                    status = link.task.status,
                )
            },
            logs = logs.map { link ->
                OutputLogSourceResponse(
                    id = requireNotNull(link.log.id),
                    title = link.log.title,
                    kind = link.log.kind,
                    status = link.log.status,
                    taskId = link.log.task?.id,
                )
            },
            linkedPost = linkedPost?.let {
                LinkedOutputPostResponse(
                    id = requireNotNull(it.id),
                    status = it.status,
                    authorUsername = requireNotNull(it.author.username),
                    slug = it.slug,
                )
            },
            createdAt = output.createdAt.toString(),
            updatedAt = output.updatedAt.toString(),
            exportedAt = output.exportedAt?.toString(),
        )
    }
}
