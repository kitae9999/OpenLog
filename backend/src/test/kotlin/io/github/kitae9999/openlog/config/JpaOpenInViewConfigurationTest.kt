package io.github.kitae9999.openlog.config

import org.junit.jupiter.api.Test
import org.springframework.boot.test.context.ConfigDataApplicationContextInitializer
import org.springframework.context.support.GenericApplicationContext
import kotlin.test.assertFalse

class JpaOpenInViewConfigurationTest {
    @Test
    fun `OSIV is disabled by default`() {
        GenericApplicationContext().use { context ->
            ConfigDataApplicationContextInitializer().initialize(context)
            context.refresh()

            assertFalse(
                context.environment.getRequiredProperty(
                    "spring.jpa.open-in-view",
                    Boolean::class.java,
                ),
            )
        }
    }
}
