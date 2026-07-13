package io.github.kitae9999.openlog.media.config

import com.google.cloud.storage.Storage
import com.google.cloud.storage.StorageOptions
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
@ConditionalOnProperty(
    prefix = "media.storage",
    name = ["provider"],
    havingValue = "gcs",
    matchIfMissing = true,
)
class StorageConfig(
    @Value("\${media.gcs.signer-service-account:\${GCS_SIGNER_SERVICE_ACCOUNT:}}")
    private val signerServiceAccount: String,
) {
    @Bean
    fun storage(): Storage {
        return StorageOptions.getDefaultInstance().service
    }

    @Bean
    fun storageSignedUrlSigner(): StorageSignedUrlSigner {
        return StorageSignedUrlSigner(signerServiceAccount)
    }
}
