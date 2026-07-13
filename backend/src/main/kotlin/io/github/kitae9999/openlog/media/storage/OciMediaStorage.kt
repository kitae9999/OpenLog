package io.github.kitae9999.openlog.media.storage

import com.oracle.bmc.model.BmcException
import com.oracle.bmc.objectstorage.ObjectStorage
import com.oracle.bmc.objectstorage.model.CreatePreauthenticatedRequestDetails
import com.oracle.bmc.objectstorage.model.RenameObjectDetails
import com.oracle.bmc.objectstorage.requests.CreatePreauthenticatedRequestRequest
import com.oracle.bmc.objectstorage.requests.DeleteObjectRequest
import com.oracle.bmc.objectstorage.requests.HeadObjectRequest
import com.oracle.bmc.objectstorage.requests.RenameObjectRequest
import io.github.kitae9999.openlog.media.exception.MediaStorageException
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.stereotype.Component
import java.time.Duration
import java.time.Instant
import java.util.Date
import java.util.UUID

@Component
@ConditionalOnProperty(prefix = "media.storage", name = ["provider"], havingValue = "oci")
class OciMediaStorage(
    private val objectStorage: ObjectStorage,
    @Value("\${media.oci.namespace:\${OCI_OBJECT_STORAGE_NAMESPACE:}}")
    private val namespace: String,
    @Value("\${media.oci.region:\${OCI_REGION:ap-tokyo-1}}")
    private val region: String,
) : MediaStorage {
    override fun createUpload(
        bucket: String,
        objectKey: String,
        contentType: String,
        expiration: Duration,
    ): MediaUpload {
        val accessUri = createPreauthenticatedRequest(
            bucket = bucket,
            objectKey = objectKey,
            expiration = expiration,
            accessType = CreatePreauthenticatedRequestDetails.AccessType.ObjectWrite,
            namePrefix = "upload",
        )

        return MediaUpload(
            url = endpoint() + accessUri,
            headers = mapOf("Content-Type" to contentType),
        )
    }

    override fun createReadUrl(
        bucket: String,
        objectKey: String,
        expiration: Duration,
    ): String {
        val accessUri = createPreauthenticatedRequest(
            bucket = bucket,
            objectKey = objectKey,
            expiration = expiration,
            accessType = CreatePreauthenticatedRequestDetails.AccessType.ObjectRead,
            namePrefix = "read",
        )
        return endpoint() + accessUri
    }

    override fun exists(bucket: String, objectKey: String): Boolean {
        return try {
            objectStorage.headObject(
                HeadObjectRequest.builder()
                    .namespaceName(configuredNamespace())
                    .bucketName(bucket)
                    .objectName(objectKey)
                    .build()
            )
            true
        } catch (e: BmcException) {
            if (e.statusCode == 404) {
                false
            } else {
                throw storageException("OCI Object Storage 객체를 확인할 수 없습니다.", e)
            }
        }
    }

    override fun move(bucket: String, sourceObjectKey: String, targetObjectKey: String) {
        try {
            objectStorage.renameObject(
                RenameObjectRequest.builder()
                    .namespaceName(configuredNamespace())
                    .bucketName(bucket)
                    .renameObjectDetails(
                        RenameObjectDetails.builder()
                            .sourceName(sourceObjectKey)
                            .newName(targetObjectKey)
                            .build()
                    )
                    .build()
            )
        } catch (e: BmcException) {
            throw storageException("OCI Object Storage 객체를 이동할 수 없습니다.", e)
        }
    }

    override fun delete(bucket: String, objectKey: String) {
        try {
            objectStorage.deleteObject(
                DeleteObjectRequest.builder()
                    .namespaceName(configuredNamespace())
                    .bucketName(bucket)
                    .objectName(objectKey)
                    .build()
            )
        } catch (e: BmcException) {
            throw storageException("OCI Object Storage 객체를 삭제할 수 없습니다.", e)
        }
    }

    private fun createPreauthenticatedRequest(
        bucket: String,
        objectKey: String,
        expiration: Duration,
        accessType: CreatePreauthenticatedRequestDetails.AccessType,
        namePrefix: String,
    ): String {
        return try {
            val response = objectStorage.createPreauthenticatedRequest(
                CreatePreauthenticatedRequestRequest.builder()
                    .namespaceName(configuredNamespace())
                    .bucketName(bucket)
                    .createPreauthenticatedRequestDetails(
                        CreatePreauthenticatedRequestDetails.builder()
                            .name("openlog-$namePrefix-${UUID.randomUUID()}")
                            .objectName(objectKey)
                            .accessType(accessType)
                            .timeExpires(Date.from(Instant.now().plus(expiration)))
                            .build()
                    )
                    .build()
            )
            response.preauthenticatedRequest.accessUri
        } catch (e: BmcException) {
            throw storageException("OCI Object Storage 접근 URL을 생성할 수 없습니다.", e)
        }
    }

    private fun configuredNamespace(): String {
        return namespace.trim().ifBlank {
            throw MediaStorageException("OCI Object Storage namespace is not configured.")
        }
    }

    private fun endpoint(): String = "https://objectstorage.${region.trim()}.oraclecloud.com"

    private fun storageException(message: String, cause: Exception): MediaStorageException {
        return MediaStorageException(message, cause)
    }
}
