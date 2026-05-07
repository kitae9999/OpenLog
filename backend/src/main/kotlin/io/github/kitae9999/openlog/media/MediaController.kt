package io.github.kitae9999.openlog.media

import io.github.kitae9999.openlog.auth.CurrentUserResolver
import io.github.kitae9999.openlog.auth.exception.OAuthAuthenticationException
import io.github.kitae9999.openlog.media.command.CreateMediaUploadUrlCommand
import io.github.kitae9999.openlog.media.dto.CreateMediaUploadUrlRequest
import io.github.kitae9999.openlog.media.dto.CreateMediaUploadUrlResponse
import io.github.kitae9999.openlog.media.result.MediaUploadUrlResult
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.servlet.support.ServletUriComponentsBuilder
import java.net.URI
import java.util.UUID

@RestController
@RequestMapping("media")
class MediaController(
    private val mediaService: MediaService,
    private val currentUserResolver: CurrentUserResolver,
) {
    @PostMapping("upload-url")
    fun createUploadUrl(
        request: HttpServletRequest,
        @Valid @RequestBody createMediaUploadUrlRequest: CreateMediaUploadUrlRequest,
    ): ResponseEntity<CreateMediaUploadUrlResponse> {
        val currentUser = currentUserResolver.resolveCurrentUser(request)
        val response = mediaService.createUploadUrl(
            currentUser,
            createMediaUploadUrlRequest.toCommand(),
        ).toResponse()

        return ResponseEntity.status(HttpStatus.CREATED).body(response)
    }

    @GetMapping("assets/{assetId}")
    fun redirectToAsset(
        request: HttpServletRequest,
        @PathVariable assetId: UUID,
    ): ResponseEntity<Void> {
        val signedUrl = mediaService.createReadUrl(assetId, resolveUserIdOrNull(request))

        return ResponseEntity.status(HttpStatus.FOUND)
            .header(HttpHeaders.CACHE_CONTROL, "private, max-age=300")
            .location(URI.create(signedUrl))
            .build()
    }

    @PatchMapping("assets/{assetId}/completion")
    fun completeUpload(
        request: HttpServletRequest,
        @PathVariable assetId: UUID,
    ): ResponseEntity<Void> {
        val currentUser = currentUserResolver.resolveCurrentUser(request)
        mediaService.markUploadCompleted(assetId, currentUser)

        return ResponseEntity.noContent().build()
    }

    private fun resolveUserIdOrNull(request: HttpServletRequest): Long? {
        return try {
            currentUserResolver.resolveUserIdFromJwt(request)
        } catch (e: OAuthAuthenticationException) {
            null
        }
    }

    private fun CreateMediaUploadUrlRequest.toCommand(): CreateMediaUploadUrlCommand {
        return CreateMediaUploadUrlCommand(
            fileName = fileName,
            originalFileName = originalFileName,
            contentType = contentType,
            sizeBytes = sizeBytes,
            purpose = purpose,
        )
    }

    private fun MediaUploadUrlResult.toResponse(): CreateMediaUploadUrlResponse {
        return CreateMediaUploadUrlResponse(
            assetId = assetId,
            uploadUrl = uploadUrl,
            markdownUrl = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/media/assets/{assetId}")
                .buildAndExpand(assetId)
                .toUriString(),
            headers = headers,
        )
    }
}
