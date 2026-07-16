package io.github.kitae9999.openlog.workspace

import com.zaxxer.hikari.HikariDataSource
import io.github.kitae9999.openlog.user.entity.User
import io.github.kitae9999.openlog.user.repository.UserRepository
import io.github.kitae9999.openlog.workspace.entity.Workspace
import io.github.kitae9999.openlog.workspace.repository.WorkspaceRepository
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase
import org.springframework.context.annotation.Import
import org.springframework.transaction.PlatformTransactionManager
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional
import org.springframework.transaction.support.TransactionTemplate
import kotlin.test.assertEquals

@DataJpaTest(
    properties = [
        "spring.flyway.enabled=false",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.datasource.url=jdbc:h2:mem:workspace-access-resolver;DB_CLOSE_DELAY=-1",
        "spring.datasource.hikari.maximum-pool-size=10",
    ],
)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(WorkspaceAccessResolver::class)
@Transactional(propagation = Propagation.NOT_SUPPORTED)
class WorkspaceAccessResolverJpaTest @Autowired constructor(
    private val transactionManager: PlatformTransactionManager,
    private val dataSource: HikariDataSource,
    private val userRepository: UserRepository,
    private val workspaceRepository: WorkspaceRepository,
    private val workspaceAccessResolver: WorkspaceAccessResolver,
) {
    @Test
    fun `owned workspace lookup returns its connection before the caller continues`() {
        val (userId, workspaceId) = TransactionTemplate(transactionManager).execute {
            val user = userRepository.save(
                User(
                    username = "owner",
                    nickname = "Owner",
                    email = "owner@example.com",
                ),
            )
            val workspace = workspaceRepository.save(
                Workspace(
                    owner = user,
                    slug = "default",
                    name = "Default",
                ),
            )

            requireNotNull(user.id) to requireNotNull(workspace.id)
        } ?: error("테스트 데이터 트랜잭션이 완료되지 않았습니다.")

        assertEquals(0, dataSource.hikariPoolMXBean.activeConnections)

        val workspace = workspaceAccessResolver.requireOwnedWorkspace(userId, workspaceId)

        assertEquals(workspaceId, workspace.id)
        assertEquals(0, dataSource.hikariPoolMXBean.activeConnections)
    }
}
