package io.github.kitae9999.openlog.memory

import io.github.kitae9999.openlog.memory.dto.CreateMemoryRequest
import io.github.kitae9999.openlog.memory.entity.WorkspaceMemory
import io.github.kitae9999.openlog.memory.repository.WorkspaceMemoryRepository
import io.github.kitae9999.openlog.user.entity.User
import io.github.kitae9999.openlog.workspace.WorkspaceAccessResolver
import io.github.kitae9999.openlog.workspace.WorkspaceChangeNotifier
import io.github.kitae9999.openlog.workspace.entity.LogKind
import io.github.kitae9999.openlog.workspace.entity.LogStatus
import io.github.kitae9999.openlog.workspace.entity.Workspace
import io.github.kitae9999.openlog.workspace.entity.WorkspaceLog
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.ArgumentMatchers.any
import org.mockito.BDDMockito.given
import org.mockito.Mock
import org.mockito.Mockito.never
import org.mockito.Mockito.verify
import org.mockito.junit.jupiter.MockitoExtension

@ExtendWith(MockitoExtension::class)
class MemoryServiceTest {
    @Mock private lateinit var repository: WorkspaceMemoryRepository
    @Mock private lateinit var accessResolver: WorkspaceAccessResolver
    @Mock private lateinit var workspaceChangeNotifier: WorkspaceChangeNotifier
    private lateinit var service: MemoryService
    private lateinit var user: User
    private lateinit var workspace: Workspace

    @BeforeEach
    fun setUp() {
        service = MemoryService(repository, accessResolver, MemoryMapper(), workspaceChangeNotifier)
        user = User(id = 1L, username = "alice")
        workspace = Workspace(id = 10L, owner = user, slug = "default", name = "Default")
    }

    @Test
    fun `createMemory saves independent markdown memory`() {
        given(accessResolver.requireOwnedWorkspace(1L, 10L)).willReturn(workspace)
        given(accessResolver.resolveTask(workspace, null)).willReturn(null)
        given(repository.save(any(WorkspaceMemory::class.java))).willAnswer { invocation ->
            val value = invocation.getArgument<WorkspaceMemory>(0)
            WorkspaceMemory(id = 20L, workspace = workspace, author = user, title = value.title, content = value.content)
        }

        val response = service.createMemory(user, 10L, CreateMemoryRequest(" Rule ", " # Keep it "))

        assertThat(response.id).isEqualTo(20L)
        assertThat(response.title).isEqualTo("Rule")
        assertThat(response.content).isEqualTo("# Keep it")
    }

    @Test
    fun `createFromLog returns existing memory without duplicate save`() {
        val log = WorkspaceLog(id = 30L, workspace = workspace, author = user, kind = LogKind.NOTE, status = LogStatus.NONE, title = "Rule", content = "Body")
        val memory = WorkspaceMemory(id = 40L, workspace = workspace, author = user, originLog = log, title = "Rule", content = "Body")
        given(accessResolver.requireOwnedWorkspace(1L, 10L)).willReturn(workspace)
        given(accessResolver.requireOwnedLog(workspace, 30L)).willReturn(log)
        given(repository.findByOriginLogId(30L)).willReturn(memory)

        val result = service.createFromLog(user, 10L, 30L)

        assertThat(result.created).isFalse()
        assertThat(result.memory.id).isEqualTo(40L)
        verify(repository, never()).save(any(WorkspaceMemory::class.java))
    }

    @Test
    fun `deleteMemories validates and deletes all selected memories`() {
        val first = WorkspaceMemory(id = 40L, workspace = workspace, author = user, title = "First", content = "Body")
        val second = WorkspaceMemory(id = 50L, workspace = workspace, author = user, title = "Second", content = "Body")
        given(accessResolver.requireOwnedWorkspace(1L, 10L)).willReturn(workspace)
        given(accessResolver.requireOwnedMemory(workspace, 40L)).willReturn(first)
        given(accessResolver.requireOwnedMemory(workspace, 50L)).willReturn(second)

        service.deleteMemories(1L, 10L, listOf(40L, 50L))

        verify(repository).deleteAll(listOf(first, second))
    }
}
