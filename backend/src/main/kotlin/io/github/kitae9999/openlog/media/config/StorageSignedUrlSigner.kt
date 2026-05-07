package io.github.kitae9999.openlog.media.config

import com.google.auth.ServiceAccountSigner
import com.google.cloud.storage.Storage.SignUrlOption

class StorageSignedUrlSigner(
    private val signer: ServiceAccountSigner?,
    private val unavailableMessage: String? = null,
) {
    fun signWithOption(): SignUrlOption {
        return SignUrlOption.signWith(
            signer ?: throw IllegalStateException(
                unavailableMessage ?: "GCS signed URL signer is not configured."
            )
        )
    }
}
