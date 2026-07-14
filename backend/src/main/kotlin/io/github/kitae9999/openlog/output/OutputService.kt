package io.github.kitae9999.openlog.output

import io.github.kitae9999.openlog.common.exception.BadRequestException
import io.github.kitae9999.openlog.common.exception.NotFoundException
import io.github.kitae9999.openlog.output.dto.OutputDetailResponse
import io.github.kitae9999.openlog.output.dto.OutputResponse
import io.github.kitae9999.openlog.output.entity.OutputLog
import io.github.kitae9999.openlog.output.entity.OutputStatus
import io.github.kitae9999.openlog.output.entity.OutputTask
import io.github.kitae9999.openlog.output.entity.WorkspaceOutput
import io.github.kitae9999.openlog.output.repository.OutputLogRepository
import io.github.kitae9999.openlog.output.repository.OutputTaskRepository
import io.github.kitae9999.openlog.output.repository.WorkspaceOutputRepository
import io.github.kitae9999.openlog.post.PostService
import io.github.kitae9999.openlog.post.repository.PostRepository
import io.github.kitae9999.openlog.user.entity.User
import io.github.kitae9999.openlog.workspace.WorkspaceAccessResolver
import io.github.kitae9999.openlog.workspace.entity.Workspace
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import kotlin.jvm.optionals.getOrNull

@Service
class OutputService(
    private val workspaceOutputRepository: WorkspaceOutputRepository,
    private val outputTaskRepository: OutputTaskRepository,
    private val outputLogRepository: OutputLogRepository,
    private val workspaceAccessResolver: WorkspaceAccessResolver,
    private val postRepository: PostRepository,
    private val postService: PostService,
    private val outputMapper: OutputMapper,
) {
    @Transactional(readOnly = true)
    fun getOutputs(userId: Long, workspaceId: Long, status: OutputStatus?): List<OutputResponse> {
        workspaceAccessResolver.requireOwnedWorkspace(userId, workspaceId)
        val outputs = if (status == null) {
            workspaceOutputRepository.findAllByWorkspaceIdOrderByUpdatedAtDesc(workspaceId)
        } else {
            workspaceOutputRepository.findAllByWorkspaceIdAndStatusOrderByUpdatedAtDesc(workspaceId, status)
        }
        val outputIds = outputs.map { requireNotNull(it.id) }
        if (outputIds.isEmpty()) {
            return emptyList()
        }
        val taskIdsByOutputId = outputTaskRepository.findAllByOutputIdIn(outputIds)
            .groupBy { requireNotNull(it.output.id) }
            .mapValues { (_, links) -> links.map { requireNotNull(it.task.id) } }
        val logIdsByOutputId = outputLogRepository.findAllByOutputIdIn(outputIds)
            .groupBy { requireNotNull(it.output.id) }
            .mapValues { (_, links) -> links.map { requireNotNull(it.log.id) } }

        return outputs.map { output ->
            val outputId = requireNotNull(output.id)
            outputMapper.toOutputResponse(
                output = output,
                taskIds = taskIdsByOutputId[outputId].orEmpty(),
                logIds = logIdsByOutputId[outputId].orEmpty(),
            )
        }
    }

    @Transactional(readOnly = true)
    fun getOutput(userId: Long, workspaceId: Long, outputId: Long): OutputDetailResponse {
        val output = requireOwnedOutput(userId, workspaceId, outputId)
        return toDetailResponse(output)
    }

    @Transactional
    fun createOutput(
        user: User,
        workspaceId: Long,
        title: String,
        content: String,
        taskIds: List<Long>,
        logIds: List<Long>,
    ): OutputDetailResponse {
        val userId = requireNotNull(user.id)
        val workspace = workspaceAccessResolver.requireOwnedWorkspace(userId, workspaceId)
        val output = workspaceOutputRepository.save(
            WorkspaceOutput(
                workspace = workspace,
                author = user,
                title = title.trim(),
                content = content.trim(),
            )
        )

        replaceSources(output, workspace, taskIds, logIds)

        return toDetailResponse(output)
    }

    @Transactional
    fun updateOutput(
        userId: Long,
        workspaceId: Long,
        outputId: Long,
        title: String,
        content: String,
        taskIds: List<Long>,
        logIds: List<Long>,
    ): OutputDetailResponse {
        val output = requireOwnedOutput(userId, workspaceId, outputId)
        requireDraft(output, "Draft 상태의 output만 수정할 수 있습니다.")
        val workspace = output.workspace

        output.update(
            title = title.trim(),
            content = content.trim(),
        )
        replaceSources(output, workspace, taskIds, logIds)

        return toDetailResponse(output)
    }

    @Transactional
    fun publishOutput(
        user: User,
        workspaceId: Long,
        outputId: Long,
        description: String,
        topics: List<String>,
    ): OutputDetailResponse {
        val userId = requireNotNull(user.id)
        val output = requireOwnedOutput(userId, workspaceId, outputId)
        requireDraft(output, "Draft 상태의 output만 발행할 수 있습니다.")
        if (postRepository.findByOutputId(outputId) != null) {
            throw BadRequestException("이미 발행된 output입니다.")
        }

        postService.createPostFromOutput(
            user = user,
            output = output,
            description = description.trim(),
            topics = topics,
        )
        output.markPublished()

        return toDetailResponse(output)
    }

    @Transactional
    fun deleteOutput(userId: Long, workspaceId: Long, outputId: Long) {
        deleteOutputs(userId, workspaceId, listOf(outputId))
    }

    @Transactional
    fun deleteOutputs(userId: Long, workspaceId: Long, outputIds: List<Long>) {
        val workspace = workspaceAccessResolver.requireOwnedWorkspace(userId, workspaceId)
        val outputs = outputIds.distinct().map { outputId ->
            requireOwnedOutput(workspace, outputId)
        }
        workspaceOutputRepository.deleteAll(outputs)
    }

    /**
     * output과 연결되어있는 소스 제거후 새걸로 재할당
     */
    private fun replaceSources(
        output: WorkspaceOutput,
        workspace: Workspace,
        rawTaskIds: List<Long>,
        rawLogIds: List<Long>,
    ) {
        val outputId = requireNotNull(output.id)
        val taskIds = rawTaskIds.distinct()
        val logIds = rawLogIds.distinct()
        val tasks = taskIds.map { taskId -> workspaceAccessResolver.requireOwnedTask(workspace, taskId) }
        val logs = logIds.map { logId -> workspaceAccessResolver.requireOwnedLog(workspace, logId) }
        val currentTasks = outputTaskRepository.findAllByOutputId(outputId)
        val currentLogs = outputLogRepository.findAllByOutputId(outputId)

        if (currentTasks.isNotEmpty()) {
            outputTaskRepository.deleteAll(currentTasks)
        }
        if (currentLogs.isNotEmpty()) {
            outputLogRepository.deleteAll(currentLogs)
        }
        if (tasks.isNotEmpty()) {
            outputTaskRepository.saveAll(tasks.map { task -> OutputTask(output, task) })
        }
        if (logs.isNotEmpty()) {
            outputLogRepository.saveAll(logs.map { log -> OutputLog(output, log) })
        }
    }

    private fun requireOwnedOutput(userId: Long, workspaceId: Long, outputId: Long): WorkspaceOutput {
        val workspace = workspaceAccessResolver.requireOwnedWorkspace(userId, workspaceId)
        return requireOwnedOutput(workspace, outputId)
    }

    private fun requireOwnedOutput(workspace: Workspace, outputId: Long): WorkspaceOutput {
        val output = workspaceOutputRepository.findById(outputId).getOrNull()
            ?: throw NotFoundException("output을 찾을 수 없습니다.")

        if (output.workspace.id != workspace.id) {
            throw BadRequestException("현재 워크스페이스에 속한 output만 사용할 수 있습니다.")
        }

        return output
    }

    private fun requireDraft(output: WorkspaceOutput, message: String) {
        if (output.status != OutputStatus.DRAFT) {
            throw BadRequestException(message)
        }
    }

    private fun toDetailResponse(output: WorkspaceOutput): OutputDetailResponse {
        val outputId = requireNotNull(output.id)
        return outputMapper.toDetailResponse(
            output = output,
            tasks = outputTaskRepository.findAllByOutputId(outputId),
            logs = outputLogRepository.findAllByOutputId(outputId),
            publishedPost = postRepository.findByOutputId(outputId),
        )
    }
}
