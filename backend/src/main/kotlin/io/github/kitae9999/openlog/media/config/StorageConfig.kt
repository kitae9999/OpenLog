package io.github.kitae9999.openlog.media.config

import com.google.auth.ServiceAccountSigner
import com.google.auth.oauth2.GoogleCredentials
import com.google.auth.oauth2.ImpersonatedCredentials
import com.google.cloud.storage.Storage
import com.google.cloud.storage.StorageOptions
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class StorageConfig(
    @Value("\${media.gcs.signer-service-account:\${GCS_SIGNER_SERVICE_ACCOUNT:}}")
    private val signerServiceAccount: String,
) {
    companion object {
        private const val CLOUD_PLATFORM_SCOPE = "https://www.googleapis.com/auth/cloud-platform"
        private const val IMPERSONATED_CREDENTIALS_LIFETIME_SECONDS = 3600
    }

    @Bean
    fun googleCredentials(): GoogleCredentials {
        val credentials = GoogleCredentials.getApplicationDefault()
        return if (credentials.createScopedRequired()) {
            credentials.createScoped(listOf(CLOUD_PLATFORM_SCOPE))
        } else {
            credentials
        }
    }

    @Bean
    fun storage(googleCredentials: GoogleCredentials): Storage {
        return StorageOptions.newBuilder()
            .setCredentials(googleCredentials)
            .build()
            .service
    }

    @Bean
    fun storageSignedUrlSigner(googleCredentials: GoogleCredentials): StorageSignedUrlSigner {
        if (googleCredentials is ServiceAccountSigner) {
            return StorageSignedUrlSigner(googleCredentials)
        }

        val targetPrincipal = signerServiceAccount.trim()
        if (targetPrincipal.isBlank()) {
            return StorageSignedUrlSigner(
                null,
                "Current Google credentials (${googleCredentials.javaClass.simpleName}) cannot sign GCS URLs. " +
                    "Configure media.gcs.signer-service-account or use service account credentials.",
            )
        }

        return StorageSignedUrlSigner(
            ImpersonatedCredentials.create(
                googleCredentials,
                targetPrincipal,
                emptyList(),
                listOf(CLOUD_PLATFORM_SCOPE),
                IMPERSONATED_CREDENTIALS_LIFETIME_SECONDS,
            )
        )
    }
}
