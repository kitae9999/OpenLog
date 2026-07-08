package io.github.kitae9999.openlog.output

import io.github.kitae9999.openlog.output.dto.CreateOutputRequest
import io.github.kitae9999.openlog.output.dto.OutputDetailResponse
import io.github.kitae9999.openlog.output.dto.OutputResponse
import io.github.kitae9999.openlog.output.dto.PublishOutputRequest
import io.github.kitae9999.openlog.output.dto.UpdateOutputRequest
import io.github.kitae9999.openlog.output.entity.OutputStatus
import io.github.kitae9999.openlog.user.entity.User
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/workspaces")
class OutputController(
    private val outputService: OutputService,
) {
    @GetMapping("/{workspaceId}/outputs")
    fun getOutputs(
        @AuthenticationPrincipal user: User,
        @PathVariable workspaceId: Long,
        @RequestParam status: OutputStatus?,
    ): List<OutputResponse> {
        return outputService.getOutputs(requireNotNull(user.id), workspaceId, status)
    }

    @GetMapping("/{workspaceId}/outputs/{outputId}")
    fun getOutput(
        @AuthenticationPrincipal user: User,
        @PathVariable workspaceId: Long,
        @PathVariable outputId: Long,
    ): OutputDetailResponse {
        return outputService.getOutput(requireNotNull(user.id), workspaceId, outputId)
    }

    @PostMapping("/{workspaceId}/outputs")
    fun createOutput(
        @AuthenticationPrincipal user: User,
        @PathVariable workspaceId: Long,
        @Valid @RequestBody request: CreateOutputRequest,
    ): ResponseEntity<OutputDetailResponse> {
        val createdOutput = outputService.createOutput(user, workspaceId, request)

        return ResponseEntity.status(201).body(createdOutput)
    }

    @PutMapping("/{workspaceId}/outputs/{outputId}")
    fun updateOutput(
        @AuthenticationPrincipal user: User,
        @PathVariable workspaceId: Long,
        @PathVariable outputId: Long,
        @Valid @RequestBody request: UpdateOutputRequest,
    ): OutputDetailResponse {
        return outputService.updateOutput(requireNotNull(user.id), workspaceId, outputId, request)
    }

    @PostMapping("/{workspaceId}/outputs/{outputId}/publish")
    fun publishOutput(
        @AuthenticationPrincipal user: User,
        @PathVariable workspaceId: Long,
        @PathVariable outputId: Long,
        @Valid @RequestBody request: PublishOutputRequest,
    ): OutputDetailResponse {
        return outputService.publishOutput(user, workspaceId, outputId, request)
    }

    @PostMapping("/{workspaceId}/outputs/{outputId}/archive")
    fun archiveOutput(
        @AuthenticationPrincipal user: User,
        @PathVariable workspaceId: Long,
        @PathVariable outputId: Long,
    ): OutputDetailResponse {
        return outputService.archiveOutput(requireNotNull(user.id), workspaceId, outputId)
    }
}
