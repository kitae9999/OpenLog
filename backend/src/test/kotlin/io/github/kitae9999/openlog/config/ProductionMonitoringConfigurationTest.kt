package io.github.kitae9999.openlog.config

import org.junit.jupiter.api.Test
import org.springframework.boot.test.context.ConfigDataApplicationContextInitializer
import org.springframework.boot.test.context.runner.ApplicationContextRunner
import kotlin.test.assertEquals
import kotlin.test.assertNull

class ProductionMonitoringConfigurationTest {
    private val contextRunner = ApplicationContextRunner()
        .withInitializer(ConfigDataApplicationContextInitializer())
        .withPropertyValues("spring.profiles.active=production")

    @Test
    fun `production profile exposes only internal health and prometheus endpoints`() {
        contextRunner.run { context ->
            assertNull(context.startupFailure)
            assertEquals("0.0.0.0", context.environment.getProperty("management.server.address"))
            assertEquals("9090", context.environment.getProperty("management.server.port"))
            assertEquals(
                "health,prometheus",
                context.environment.getProperty("management.endpoints.web.exposure.include"),
            )
            assertEquals("never", context.environment.getProperty("management.endpoint.health.show-details"))
            assertEquals(
                "readinessState,db",
                context.environment.getProperty("management.endpoint.health.group.readiness.include"),
            )
        }
    }

    @Test
    fun `production profile emits ecs json and enables request histograms`() {
        contextRunner.run { context ->
            assertNull(context.startupFailure)
            assertEquals("ecs", context.environment.getProperty("logging.structured.format.console"))
            assertEquals(
                "true",
                context.environment.getProperty(
                    "management.metrics.distribution.percentiles-histogram.http.server.requests",
                ),
            )
        }
    }
}
