package io.github.kitae9999.openlog.media.config

import com.google.auth.ServiceAccountSigner
import com.google.auth.oauth2.GoogleCredentials
import com.google.auth.oauth2.ImpersonatedCredentials
import com.google.cloud.storage.Storage.SignUrlOption
import io.github.kitae9999.openlog.media.exception.MediaStorageException

class StorageSignedUrlSigner(
    private val signerServiceAccount: String,
) {
    private var cachedSigner: ServiceAccountSigner? = null

    fun signWithOption(): SignUrlOption {
        return SignUrlOption.signWith(resolveSigner())
    }

    private fun resolveSigner(): ServiceAccountSigner {
        cachedSigner?.let { return it }

        val credentials = applicationDefaultCredentials()
        val signer = when (credentials) {
            is ServiceAccountSigner -> credentials
            else -> impersonatedSigner(credentials)
        }
        cachedSigner = signer

        return signer
    }

    private fun applicationDefaultCredentials(): GoogleCredentials {
        val credentials = try {
            GoogleCredentials.getApplicationDefault()
        } catch (e: Exception) {
            throw MediaStorageException(
                "GCS signed URL credentials are not configured. " +
                    "Set GOOGLE_APPLICATION_CREDENTIALS, run gcloud application-default login, " +
                    "or run on GCE with metadata credentials.",
                e,
            )
        }

        return if (credentials.createScopedRequired()) {
            credentials.createScoped(listOf(CLOUD_PLATFORM_SCOPE))
        } else {
            credentials
        }
    }

    private fun impersonatedSigner(credentials: GoogleCredentials): ServiceAccountSigner {
        val targetPrincipal = signerServiceAccount.trim()
        if (targetPrincipal.isBlank()) {
            throw MediaStorageException(
                "Current Google credentials (${credentials.javaClass.simpleName}) cannot sign GCS URLs. " +
                    "Configure media.gcs.signer-service-account or GCS_SIGNER_SERVICE_ACCOUNT.",
            )
        }

        return ImpersonatedCredentials.create(
            credentials,
            targetPrincipal,
            emptyList(),
            listOf(CLOUD_PLATFORM_SCOPE),
            IMPERSONATED_CREDENTIALS_LIFETIME_SECONDS,
        )
    }

    companion object {
        private const val CLOUD_PLATFORM_SCOPE = "https://www.googleapis.com/auth/cloud-platform"
        private const val IMPERSONATED_CREDENTIALS_LIFETIME_SECONDS = 3600
    }
}
