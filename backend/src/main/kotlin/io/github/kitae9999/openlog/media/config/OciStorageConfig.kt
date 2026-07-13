package io.github.kitae9999.openlog.media.config

import com.oracle.bmc.Region
import com.oracle.bmc.auth.InstancePrincipalsAuthenticationDetailsProvider
import com.oracle.bmc.objectstorage.ObjectStorage
import com.oracle.bmc.objectstorage.ObjectStorageClient
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
@ConditionalOnProperty(prefix = "media.storage", name = ["provider"], havingValue = "oci")
class OciStorageConfig(
    @Value("\${media.oci.region:\${OCI_REGION:ap-tokyo-1}}")
    private val region: String,
) {
    @Bean(destroyMethod = "close")
    fun objectStorage(): ObjectStorage {
        val authenticationProvider = InstancePrincipalsAuthenticationDetailsProvider.builder().build()
        return ObjectStorageClient.builder()
            .region(Region.fromRegionId(region.trim()))
            .build(authenticationProvider)
    }
}
