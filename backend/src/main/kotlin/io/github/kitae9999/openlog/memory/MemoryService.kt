package io.github.kitae9999.openlog.memory

import io.github.kitae9999.openlog.common.cursor.DateTimeIdCursorCodec
import io.github.kitae9999.openlog.memory.dto.CreateMemoryRequest
import io.github.kitae9999.openlog.memory.dto.MemoryCursorResponse
import io.github.kitae9999.openlog.memory.dto.MemoryResponse
import io.github.kitae9999.openlog.memory.dto.UpdateMemoryRequest
import io.github.kitae9999.openlog.memory.entity.WorkspaceMemory
import io.github.kitae9999.openlog.memory.repository.WorkspaceMemoryRepository
import io.github.kitae9999.openlog.user.entity.User
import io.github.kitae9999.openlog.workspace.WorkspaceAccessResolver
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

data class LogMemoryResult(
    val memory: MemoryResponse,
    val created: Boolean,
)

@Service
class MemoryService(
    private val memoryRepository: WorkspaceMemoryRepository,
    private val workspaceAccessResolver: WorkspaceAccessResolver,
    private val memoryMapper: MemoryMapper,
) {
    @Transactional(readOnly = true)
    fun getMemories(
        userId: Long,
        workspaceId: Long,
        cursor: String?,
        size: Int,
    ): MemoryCursorResponse {
        workspaceAccessResolver.requireOwnedWorkspace(userId, workspaceId)
        val safeSize = size.coerceIn(1, MAX_PAGE_SIZE)
        val marker = cursor?.let(DateTimeIdCursorCodec::decode)
        val pageable = PageRequest.of(0, safeSize + 1)
        val memories = if (marker == null) {
            memoryRepository.findAllByWorkspaceIdOrderByUpdatedAtDescIdDesc(workspaceId, pageable)
        } else {
            memoryRepository.findMemoriesAfterCursor(workspaceId, marker.createdAt, marker.id, pageable)
        }
        val hasNext = memories.size > safeSize
        val pageMemories = memories.take(safeSize)

        return MemoryCursorResponse(
            memories = pageMemories.map(memoryMapper::toResponse),
            size = safeSize,
            nextCursor = pageMemories.lastOrNull()
                ?.takeIf { hasNext }
                ?.let { DateTimeIdCursorCodec.encode(it.updatedAt, requireNotNull(it.id)) },
            hasNext = hasNext,
        )
    }

    @Transactional(readOnly = true)
    fun getMemory(userId: Long, workspaceId: Long, memoryId: Long): MemoryResponse {
        val workspace = workspaceAccessResolver.requireOwnedWorkspace(userId, workspaceId)
        return memoryMapper.toResponse(workspaceAccessResolver.requireOwnedMemory(workspace, memoryId))
    }

    @Transactional
    fun createMemory(user: User, workspaceId: Long, request: CreateMemoryRequest): MemoryResponse {
        val workspace = workspaceAccessResolver.requireOwnedWorkspace(requireNotNull(user.id), workspaceId)
        val task = workspaceAccessResolver.resolveTask(workspace, request.taskId)
        val memory = memoryRepository.save(
            WorkspaceMemory(
                workspace = workspace,
                author = user,
                task = task,
                title = request.title.trim(),
                content = request.content.trim(),
            )
        )

        return memoryMapper.toResponse(memory)
    }

    @Transactional
    fun createFromLog(user: User, workspaceId: Long, logId: Long): LogMemoryResult {
        val workspace = workspaceAccessResolver.requireOwnedWorkspace(requireNotNull(user.id), workspaceId)
        val log = workspaceAccessResolver.requireOwnedLog(workspace, logId)
        val existing = memoryRepository.findByOriginLogId(logId)
        if (existing != null) {
            return LogMemoryResult(memoryMapper.toResponse(existing), created = false)
        }
        val memory = memoryRepository.save(
            WorkspaceMemory(
                workspace = workspace,
                author = user,
                task = log.task,
                originLog = log,
                title = log.title,
                content = log.content,
            )
        )

        return LogMemoryResult(memoryMapper.toResponse(memory), created = true)
    }

    @Transactional
    fun updateMemory(
        userId: Long,
        workspaceId: Long,
        memoryId: Long,
        request: UpdateMemoryRequest,
    ): MemoryResponse {
        val workspace = workspaceAccessResolver.requireOwnedWorkspace(userId, workspaceId)
        val memory = workspaceAccessResolver.requireOwnedMemory(workspace, memoryId)
        val task = workspaceAccessResolver.resolveTask(workspace, request.taskId)
        memory.update(request.title.trim(), request.content.trim(), task)

        return memoryMapper.toResponse(memory)
    }

    @Transactional
    fun deleteMemory(userId: Long, workspaceId: Long, memoryId: Long) {
        val workspace = workspaceAccessResolver.requireOwnedWorkspace(userId, workspaceId)
        memoryRepository.delete(workspaceAccessResolver.requireOwnedMemory(workspace, memoryId))
    }

    private companion object {
        private const val MAX_PAGE_SIZE = 50
    }
}
