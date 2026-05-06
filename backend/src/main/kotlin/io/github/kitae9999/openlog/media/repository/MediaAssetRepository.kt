package io.github.kitae9999.openlog.media.repository

import io.github.kitae9999.openlog.media.entity.MediaAsset
import org.springframework.data.jpa.repository.JpaRepository

interface MediaAssetRepository : JpaRepository<MediaAsset, Long>
