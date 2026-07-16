package io.github.kitae9999.openlog.media

import io.github.kitae9999.openlog.media.entity.MediaAsset
import io.github.kitae9999.openlog.media.entity.MediaPurpose
import io.github.kitae9999.openlog.media.entity.MediaStatus
import io.github.kitae9999.openlog.media.repository.MediaAssetRepository
import io.github.kitae9999.openlog.media.storage.MediaStorage
import io.github.kitae9999.openlog.user.entity.User
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.BDDMockito.given
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import java.time.Duration
import java.util.UUID

@ExtendWith(MockitoExtension::class)
class MediaServiceTest {
    @Mock
    private lateinit var mediaAssetRepository: MediaAssetRepository

    @Mock
    private lateinit var mediaStorage: MediaStorage

    private lateinit var mediaService: MediaService

    @BeforeEach
    fun setUp() {
        mediaService = MediaService(
            mediaAssetRepository = mediaAssetRepository,
            mediaStorage = mediaStorage,
            bucketName = "openlog-media",
            uploadExpirationMinutes = 15,
            readExpirationMinutes = 15,
        )
    }

    @Test
    fun `completing a profile image upload attaches it and updates the owner`() {
        val assetId = UUID.randomUUID()
        val owner = User(id = 7L, username = "alice", nickname = "Alice")
        val asset = profileImageAsset(assetId, owner)
        val assetUrl = "https://api.openlog.dev/media/assets/$assetId"
        given(mediaAssetRepository.findByPublicId(assetId)).willReturn(asset)
        given(mediaStorage.exists(asset.bucket, asset.objectKey)).willReturn(true)

        mediaService.markUploadCompleted(assetId, owner, assetUrl)

        assertThat(asset.status).isEqualTo(MediaStatus.ATTACHED)
        assertThat(asset.attachedAt).isNotNull()
        assertThat(owner.profileImageUrl).isEqualTo(assetUrl)
    }

    @Test
    fun `an attached profile image is publicly readable`() {
        val assetId = UUID.randomUUID()
        val owner = User(id = 7L, username = "alice", nickname = "Alice")
        val asset = profileImageAsset(assetId, owner).also { it.attachToProfile() }
        val signedUrl = "https://storage.openlog.dev/profile.webp"
        given(mediaAssetRepository.findByPublicId(assetId)).willReturn(asset)
        given(
            mediaStorage.createReadUrl(
                asset.bucket,
                asset.objectKey,
                Duration.ofMinutes(15),
            )
        ).willReturn(signedUrl)

        val result = mediaService.createReadUrl(assetId, viewerUserId = null)

        assertThat(result).isEqualTo(signedUrl)
    }

    private fun profileImageAsset(assetId: UUID, owner: User) = MediaAsset(
        publicId = assetId,
        owner = owner,
        purpose = MediaPurpose.PROFILE_IMAGE,
        bucket = "openlog-media",
        objectKey = "profile-images/users/7/$assetId.webp",
        contentType = "image/webp",
        sizeBytes = 1024,
    )
}
