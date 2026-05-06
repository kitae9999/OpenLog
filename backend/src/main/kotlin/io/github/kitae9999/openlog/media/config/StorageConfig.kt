package io.github.kitae9999.openlog.media.config

import com.google.cloud.storage.Storage
import com.google.cloud.storage.StorageOptions
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class StorageConfig {
    @Bean
    fun storage(): Storage {
        return StorageOptions.getDefaultInstance().service
    }
}
