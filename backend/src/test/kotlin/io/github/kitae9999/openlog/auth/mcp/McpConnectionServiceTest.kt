package io.github.kitae9999.openlog.auth.mcp

import io.github.kitae9999.openlog.common.exception.NotFoundException
import io.github.kitae9999.openlog.user.entity.User
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.ArgumentMatchers.any
import org.mockito.BDDMockito.given
import org.mockito.Mock
import org.mockito.Mockito.verify
import org.mockito.junit.jupiter.MockitoExtension
import org.springframework.jdbc.core.JdbcTemplate
import java.util.UUID

@ExtendWith(MockitoExtension::class)
class McpConnectionServiceTest {
    @Mock
    private lateinit var connectionRepository: McpConnectionRepository

    @Mock
    private lateinit var jdbcTemplate: JdbcTemplate

    private lateinit var service: McpConnectionService

    @BeforeEach
    fun setUp() {
        service = McpConnectionService(connectionRepository, jdbcTemplate)
    }

    @Test
    fun `changes the current profile and returns it immediately`() {
        val connection = connection(userId = 10)
        given(connectionRepository.findByIdAndUserIdAndRevokedAtIsNull(connection.id, 10))
            .willReturn(connection)

        val response = service.update(10, connection.id, McpPermissionProfile.FULL)

        assertThat(response.permissionProfile).isEqualTo("full")
        assertThat(connection.permissionProfile).isEqualTo(McpPermissionProfile.FULL)
    }

    @Test
    fun `does not expose another users connection`() {
        val connectionId = UUID.randomUUID()
        given(connectionRepository.findByIdAndUserIdAndRevokedAtIsNull(connectionId, 20))
            .willReturn(null)

        assertThatThrownBy {
            service.update(20, connectionId, McpPermissionProfile.READ_ONLY)
        }.isInstanceOf(NotFoundException::class.java)
    }

    @Test
    fun `revokes the connection and deletes every token for that user and client`() {
        val connection = connection(userId = 10)
        given(connectionRepository.findByIdAndUserIdAndRevokedAtIsNull(connection.id, 10))
            .willReturn(connection)

        service.revoke(10, connection.id)

        assertThat(connection.revokedAt).isNotNull()
        verify(jdbcTemplate).update(
            "delete from oauth2_authorization where registered_client_id = ? and principal_name = ?",
            connection.registeredClientId,
            "10",
        )
        verify(jdbcTemplate).update(
            "delete from oauth2_authorization_consent where registered_client_id = ? and principal_name = ?",
            connection.registeredClientId,
            "10",
        )
    }

    @Test
    fun `creates isolated connections when two users approve the same client`() {
        val firstUser = User(id = 10, username = "first", nickname = "First")
        val secondUser = User(id = 20, username = "second", nickname = "Second")
        given(connectionRepository.findByUserIdAndRegisteredClientIdAndRevokedAtIsNull(10, "registered-client"))
            .willReturn(null)
        given(connectionRepository.findByUserIdAndRegisteredClientIdAndRevokedAtIsNull(20, "registered-client"))
            .willReturn(null)
        given(connectionRepository.save(any(McpConnection::class.java))).willAnswer { it.arguments[0] }

        val first = service.approve(
            firstUser,
            "registered-client",
            "public-client",
            "Codex",
            "http://127.0.0.1:1455",
            McpPermissionProfile.SAFE_WRITE,
        )
        val second = service.approve(
            secondUser,
            "registered-client",
            "public-client",
            "Codex",
            "http://127.0.0.1:1455",
            McpPermissionProfile.READ_ONLY,
        )

        assertThat(first.id).isNotEqualTo(second.id)
        assertThat(first.user.id).isEqualTo(10)
        assertThat(second.user.id).isEqualTo(20)
        assertThat(first.permissionProfile).isEqualTo(McpPermissionProfile.SAFE_WRITE)
        assertThat(second.permissionProfile).isEqualTo(McpPermissionProfile.READ_ONLY)
    }

    private fun connection(userId: Long) = McpConnection(
        user = User(id = userId, username = "user$userId", nickname = "User $userId"),
        registeredClientId = "registered-client",
        clientId = "public-client",
        clientName = "Codex",
        callbackOrigin = "http://127.0.0.1:1455",
    )
}
