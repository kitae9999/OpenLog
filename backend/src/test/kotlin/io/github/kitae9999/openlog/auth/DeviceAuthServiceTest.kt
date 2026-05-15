package io.github.kitae9999.openlog.auth

import io.github.kitae9999.openlog.auth.dto.DeviceTokenStatus
import io.github.kitae9999.openlog.common.exception.BadRequestException
import io.github.kitae9999.openlog.user.entity.User
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.BDDMockito.given
import org.mockito.Mock
import org.mockito.Mockito.verify
import org.mockito.Mockito.mockingDetails
import org.mockito.junit.jupiter.MockitoExtension
import org.springframework.data.redis.core.StringRedisTemplate
import org.springframework.data.redis.core.ValueOperations
import java.time.Duration

@ExtendWith(MockitoExtension::class)
class DeviceAuthServiceTest {
    @Mock
    private lateinit var redisTemplate: StringRedisTemplate

    @Mock
    private lateinit var valueOperations: ValueOperations<String, String>

    private lateinit var deviceAuthService: DeviceAuthService

    private val jwtTokenService = JwtTokenService(
        secret = "openlog-local-jwt-secret-openlog-local-jwt-secret",
        issuer = "openlog",
        accessTokenExpirationSeconds = 3600,
    )

    @BeforeEach
    fun setUp() {
        given(redisTemplate.opsForValue()).willReturn(valueOperations)

        deviceAuthService = DeviceAuthService(
            redisTemplate = redisTemplate,
            jwtTokenService = jwtTokenService,
            frontendHomeUrl = "https://openlog.kr",
        )
    }

    @Test
    fun `start creates a device login session`() {
        val response = deviceAuthService.start()

        assertThat(response.deviceCode).isNotBlank()
        assertThat(response.userCode).matches("[A-Z2-9]{4}-[A-Z2-9]{4}")
        assertThat(response.verificationUri).isEqualTo("https://openlog.kr/cli-login")
        assertThat(response.verificationUriComplete)
            .isEqualTo("https://openlog.kr/cli-login?code=${response.userCode}")
        assertThat(response.expiresIn).isEqualTo(600)
        assertThat(response.interval).isEqualTo(2)
    }

    @Test
    fun `approve stores an issued access token for the device code`() {
        val user = User(id = 7L, username = "kitae9999", nickname = "ASH")

        given(valueOperations.get("auth:device:user:ABCD-2345")).willReturn("device-code")
        given(valueOperations.get("auth:device:code:device-code")).willReturn("PENDING")
        given(redisTemplate.getExpire("auth:device:code:device-code")).willReturn(120L)

        deviceAuthService.approve("abcd-2345", user)

        val invocation = mockingDetails(valueOperations).invocations.single {
            it.method.name == "set" && it.arguments[0] == "auth:device:code:device-code"
        }
        val storedValue = invocation.arguments[1] as String
        assertThat(storedValue).startsWith("APPROVED:")
        assertThat(storedValue.removePrefix("APPROVED:")).isNotBlank()
        assertThat(invocation.arguments[2]).isEqualTo(Duration.ofSeconds(120))
        verify(redisTemplate).delete("auth:device:user:ABCD-2345")
    }

    @Test
    fun `token returns pending while approval has not completed`() {
        given(valueOperations.get("auth:device:code:device-code")).willReturn("PENDING")

        val response = deviceAuthService.token("device-code")

        assertThat(response.status).isEqualTo(DeviceTokenStatus.PENDING)
        assertThat(response.interval).isEqualTo(2)
        assertThat(response.accessToken).isNull()
    }

    @Test
    fun `token consumes an approved access token`() {
        given(valueOperations.get("auth:device:code:device-code")).willReturn("APPROVED:issued-token")

        val response = deviceAuthService.token("device-code")

        assertThat(response.status).isEqualTo(DeviceTokenStatus.APPROVED)
        assertThat(response.accessToken).isEqualTo("issued-token")
        assertThat(response.expiresIn).isEqualTo(3600)
        verify(redisTemplate).delete("auth:device:code:device-code")
    }

    @Test
    fun `approve rejects expired or unknown user code`() {
        given(valueOperations.get("auth:device:user:ABCD-2345")).willReturn(null)

        assertThatThrownBy {
            deviceAuthService.approve(
                userCode = "ABCD-2345",
                currentUser = User(id = 7L, username = "kitae9999", nickname = "ASH"),
            )
        }.isInstanceOf(BadRequestException::class.java)
    }
}
