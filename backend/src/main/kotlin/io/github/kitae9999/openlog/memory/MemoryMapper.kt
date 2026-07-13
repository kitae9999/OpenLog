package io.github.kitae9999.openlog.memory

import io.github.kitae9999.openlog.memory.dto.MemoryReferenceResponse
import io.github.kitae9999.openlog.memory.dto.MemoryResponse
import io.github.kitae9999.openlog.memory.entity.WorkspaceMemory
import org.springframework.stereotype.Component

@Component
class MemoryMapper {
    fun toResponse(memory: WorkspaceMemory): MemoryResponse {
        return MemoryResponse(
            id = requireNotNull(memory.id),
            title = memory.title,
            content = memory.content,
            excerpt = excerpt(memory.content),
            task = memory.task?.let { MemoryReferenceResponse(requireNotNull(it.id), it.title) },
            originLog = memory.originLog?.let { MemoryReferenceResponse(requireNotNull(it.id), it.title) },
            createdAt = memory.createdAt.toString(),
            updatedAt = memory.updatedAt.toString(),
        )
    }

    private fun excerpt(content: String): String {
        val plain = content
            .replace(Regex("(?m)^#+\\s+"), "")
            .replace(Regex("[*`_~\\[\\]()]"), "")
            .trim()

        return if (plain.length <= 160) plain else "${plain.take(157).trim()}..."
    }
}
