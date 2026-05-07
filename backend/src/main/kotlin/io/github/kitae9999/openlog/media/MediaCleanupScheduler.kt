package io.github.kitae9999.openlog.media

import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component

@Component
class MediaCleanupScheduler(
    private val mediaService: MediaService,
) {
    private val logger = LoggerFactory.getLogger(MediaCleanupScheduler::class.java)

    @Scheduled(fixedDelayString = "\${media.cleanup.fixed-delay-millis:1800000}")
    fun cleanupOrphanAssets() {
        val deletedCount = mediaService.cleanupOrphanAssets()
        if (deletedCount > 0) {
            logger.info("Deleted {} orphan media assets.", deletedCount)
        }
    }
}
