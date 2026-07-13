package io.github.kitae9999.openlog.memory

import io.github.kitae9999.openlog.memory.dto.CreateMemoryRequest
import io.github.kitae9999.openlog.memory.dto.MemoryCursorResponse
import io.github.kitae9999.openlog.memory.dto.MemoryResponse
import io.github.kitae9999.openlog.memory.dto.UpdateMemoryRequest
import io.github.kitae9999.openlog.user.entity.User
import io.github.kitae9999.openlog.workspace.dto.BulkDeleteRequest
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/workspaces/{workspaceId}")
class MemoryController(
    private val memoryService: MemoryService,
) {
    @GetMapping("/memories")
    fun getMemories(
        @AuthenticationPrincipal user: User,
        @PathVariable workspaceId: Long,
        @RequestParam(required = false) cursor: String?,
        @RequestParam(defaultValue = "20") size: Int,
    ): MemoryCursorResponse = memoryService.getMemories(requireNotNull(user.id), workspaceId, cursor, size)

    @GetMapping("/memories/{memoryId}")
    fun getMemory(
        @AuthenticationPrincipal user: User,
        @PathVariable workspaceId: Long,
        @PathVariable memoryId: Long,
    ): MemoryResponse = memoryService.getMemory(requireNotNull(user.id), workspaceId, memoryId)

    @PostMapping("/memories")
    fun createMemory(
        @AuthenticationPrincipal user: User,
        @PathVariable workspaceId: Long,
        @Valid @RequestBody request: CreateMemoryRequest,
    ): ResponseEntity<MemoryResponse> = ResponseEntity.status(201)
        .body(memoryService.createMemory(user, workspaceId, request))

    @PostMapping("/logs/{logId}/memory")
    fun createFromLog(
        @AuthenticationPrincipal user: User,
        @PathVariable workspaceId: Long,
        @PathVariable logId: Long,
    ): ResponseEntity<MemoryResponse> {
        val result = memoryService.createFromLog(user, workspaceId, logId)
        return ResponseEntity.status(if (result.created) 201 else 200).body(result.memory)
    }

    @PutMapping("/memories/{memoryId}")
    fun updateMemory(
        @AuthenticationPrincipal user: User,
        @PathVariable workspaceId: Long,
        @PathVariable memoryId: Long,
        @Valid @RequestBody request: UpdateMemoryRequest,
    ): MemoryResponse = memoryService.updateMemory(requireNotNull(user.id), workspaceId, memoryId, request)

    @DeleteMapping("/memories/{memoryId}")
    fun deleteMemory(
        @AuthenticationPrincipal user: User,
        @PathVariable workspaceId: Long,
        @PathVariable memoryId: Long,
    ): ResponseEntity<Void> {
        memoryService.deleteMemory(requireNotNull(user.id), workspaceId, memoryId)
        return ResponseEntity.noContent().build()
    }

    @PostMapping("/memories/bulk-delete")
    fun deleteMemories(
        @AuthenticationPrincipal user: User,
        @PathVariable workspaceId: Long,
        @Valid @RequestBody request: BulkDeleteRequest,
    ): ResponseEntity<Void> {
        memoryService.deleteMemories(requireNotNull(user.id), workspaceId, request.ids)
        return ResponseEntity.noContent().build()
    }
}
