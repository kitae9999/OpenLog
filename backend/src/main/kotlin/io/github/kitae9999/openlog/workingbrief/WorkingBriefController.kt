package io.github.kitae9999.openlog.workingbrief

import io.github.kitae9999.openlog.user.entity.User
import io.github.kitae9999.openlog.workingbrief.dto.UpsertWorkingBriefRequest
import io.github.kitae9999.openlog.workingbrief.dto.WorkingBriefResponse
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/workspaces/{workspaceId}/working-brief")
class WorkingBriefController(
    private val workingBriefService: WorkingBriefService,
) {
    @GetMapping
    fun getBrief(
        @AuthenticationPrincipal user: User,
        @PathVariable workspaceId: Long,
    ): WorkingBriefResponse =
        workingBriefService.getBrief(requireNotNull(user.id), workspaceId)

    @PutMapping
    fun upsertBrief(
        @AuthenticationPrincipal user: User,
        @PathVariable workspaceId: Long,
        @Valid @RequestBody request: UpsertWorkingBriefRequest,
    ): WorkingBriefResponse =
        workingBriefService.upsertBrief(user, workspaceId, request)

    @DeleteMapping
    fun clearBrief(
        @AuthenticationPrincipal user: User,
        @PathVariable workspaceId: Long,
    ): ResponseEntity<Void> {
        workingBriefService.clearBrief(requireNotNull(user.id), workspaceId)
        return ResponseEntity.noContent().build()
    }
}
