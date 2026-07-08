package io.github.kitae9999.openlog.output

import io.github.kitae9999.openlog.common.exception.BadRequestException
import io.github.kitae9999.openlog.output.dto.CreateOutputRequest
import io.github.kitae9999.openlog.output.dto.PublishOutputRequest
import io.github.kitae9999.openlog.output.dto.UpdateOutputRequest
import io.github.kitae9999.openlog.output.entity.OutputLog
import io.github.kitae9999.openlog.output.entity.OutputStatus
import io.github.kitae9999.openlog.output.entity.OutputTask
import io.github.kitae9999.openlog.output.entity.WorkspaceOutput
import io.github.kitae9999.openlog.output.repository.OutputLogRepository
import io.github.kitae9999.openlog.output.repository.OutputTaskRepository
import io.github.kitae9999.openlog.output.repository.WorkspaceOutputRepository
import io.github.kitae9999.openlog.post.PostService
import io.github.kitae9999.openlog.post.dto.PostWriteResponse
import io.github.kitae9999.openlog.post.repository.PostRepository
import io.github.kitae9999.openlog.user.entity.User
import io.github.kitae9999.openlog.workspace.WorkspaceAccessResolver
import io.github.kitae9999.openlog.workspace.entity.LogKind
import io.github.kitae9999.openlog.workspace.entity.LogStatus
import io.github.kitae9999.openlog.workspace.entity.TaskStatus
import io.github.kitae9999.openlog.workspace.entity.Workspace
import io.github.kitae9999.openlog.workspace.entity.WorkspaceLog
import io.github.kitae9999.openlog.workspace.entity.WorkspaceTask
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.ArgumentCaptor
import org.mockito.ArgumentMatchers.any
import org.mockito.BDDMockito.given
import org.mockito.Mock
import org.mockito.Mockito.never
import org.mockito.Mockito.verify
import org.mockito.Mockito.verifyNoInteractions
import org.mockito.junit.jupiter.MockitoExtension
import java.util.Optional

@ExtendWith(MockitoExtension::class)
class OutputServiceTest {
    @Mock
    private lateinit var workspaceOutputRepository: WorkspaceOutputRepository

    @Mock
    private lateinit var outputTaskRepository: OutputTaskRepository

    @Mock
    private lateinit var outputLogRepository: OutputLogRepository

    @Mock
    private lateinit var workspaceAccessResolver: WorkspaceAccessResolver

    @Mock
    private lateinit var postRepository: PostRepository

    @Mock
    private lateinit var postService: PostService

    private lateinit var outputService: OutputService

    private val user = User(id = 1L, username = "alice", nickname = "Alice")
    private val workspace = Workspace(id = 100L, owner = user, slug = "default", name = "Default")
    private val task = WorkspaceTask(
        id = 10L,
        workspace = workspace,
        author = user,
        title = "Ship output",
        status = TaskStatus.DOING,
    )
    private val log = WorkspaceLog(
        id = 20L,
        workspace = workspace,
        author = user,
        task = task,
        kind = LogKind.NOTE,
        status = LogStatus.NONE,
        title = "Source note",
        content = "Source content",
    )

    @BeforeEach
    fun setUp() {
        outputService = OutputService(
            workspaceOutputRepository = workspaceOutputRepository,
            outputTaskRepository = outputTaskRepository,
            outputLogRepository = outputLogRepository,
            workspaceAccessResolver = workspaceAccessResolver,
            postRepository = postRepository,
            postService = postService,
            outputMapper = OutputMapper(),
        )
    }

    @Test
    fun `createOutput saves output with source tasks and logs`() {
        given(workspaceAccessResolver.requireOwnedWorkspace(1L, 100L)).willReturn(workspace)
        given(workspaceAccessResolver.requireOwnedTask(workspace, 10L)).willReturn(task)
        given(workspaceAccessResolver.requireOwnedLog(workspace, 20L)).willReturn(log)
        given(workspaceOutputRepository.save(any(WorkspaceOutput::class.java))).willAnswer { invocation ->
            val output = invocation.getArgument<WorkspaceOutput>(0)
            WorkspaceOutput(
                id = 40L,
                workspace = output.workspace,
                author = output.author,
                title = output.title,
                content = output.content,
            )
        }
        given(outputTaskRepository.findAllByOutputId(40L)).willReturn(emptyList())
        given(outputLogRepository.findAllByOutputId(40L)).willReturn(emptyList())

        val response = outputService.createOutput(
            user = user,
            workspaceId = 100L,
            request = CreateOutputRequest(
                title = " Refined publish note ",
                content = " Clean content ",
                taskIds = listOf(10L),
                logIds = listOf(20L),
            ),
        )

        val outputCaptor = ArgumentCaptor.forClass(WorkspaceOutput::class.java)
        @Suppress("UNCHECKED_CAST")
        val taskLinksCaptor =
            ArgumentCaptor.forClass(Iterable::class.java) as ArgumentCaptor<Iterable<OutputTask>>
        @Suppress("UNCHECKED_CAST")
        val logLinksCaptor =
            ArgumentCaptor.forClass(Iterable::class.java) as ArgumentCaptor<Iterable<OutputLog>>
        verify(workspaceOutputRepository).save(outputCaptor.capture())
        verify(outputTaskRepository).saveAll(taskLinksCaptor.capture())
        verify(outputLogRepository).saveAll(logLinksCaptor.capture())
        assertThat(outputCaptor.value.title).isEqualTo("Refined publish note")
        assertThat(outputCaptor.value.content).isEqualTo("Clean content")
        assertThat(taskLinksCaptor.value.single().task.id).isEqualTo(10L)
        assertThat(logLinksCaptor.value.single().log.id).isEqualTo(20L)
        assertThat(response.id).isEqualTo(40L)
        assertThat(response.status).isEqualTo(OutputStatus.DRAFT)
    }

    @Test
    fun `createOutput rejects source task from another workspace`() {
        given(workspaceAccessResolver.requireOwnedWorkspace(1L, 100L)).willReturn(workspace)
        given(workspaceOutputRepository.save(any(WorkspaceOutput::class.java))).willAnswer { invocation ->
            val output = invocation.getArgument<WorkspaceOutput>(0)
            WorkspaceOutput(
                id = 40L,
                workspace = output.workspace,
                author = output.author,
                title = output.title,
                content = output.content,
            )
        }
        given(workspaceAccessResolver.requireOwnedTask(workspace, 99L))
            .willThrow(BadRequestException("현재 워크스페이스에 속한 태스크만 연결할 수 있습니다."))

        assertThatThrownBy {
            outputService.createOutput(
                user = user,
                workspaceId = 100L,
                request = CreateOutputRequest(
                    title = "Draft",
                    content = "Content",
                    taskIds = listOf(99L),
                ),
            )
        }.isInstanceOf(BadRequestException::class.java)

        verifyNoInteractions(outputTaskRepository, outputLogRepository)
    }

    @Test
    fun `updateOutput replaces title content and source links`() {
        val output = WorkspaceOutput(
            id = 40L,
            workspace = workspace,
            author = user,
            title = "Old title",
            content = "Old content",
        )
        val oldTask = WorkspaceTask(id = 9L, workspace = workspace, author = user, title = "Old")
        val oldLog = WorkspaceLog(
            id = 19L,
            workspace = workspace,
            author = user,
            kind = LogKind.NOTE,
            status = LogStatus.NONE,
            title = "Old log",
            content = "Old content",
        )
        given(workspaceAccessResolver.requireOwnedWorkspace(1L, 100L)).willReturn(workspace)
        given(workspaceOutputRepository.findById(40L)).willReturn(Optional.of(output))
        given(workspaceAccessResolver.requireOwnedTask(workspace, 10L)).willReturn(task)
        given(workspaceAccessResolver.requireOwnedLog(workspace, 20L)).willReturn(log)
        val oldTaskLink = OutputTask(output, oldTask)
        val oldLogLink = OutputLog(output, oldLog)
        given(outputTaskRepository.findAllByOutputId(40L))
            .willReturn(listOf(oldTaskLink), listOf(OutputTask(output, task)))
        given(outputLogRepository.findAllByOutputId(40L))
            .willReturn(listOf(oldLogLink), listOf(OutputLog(output, log)))

        val response = outputService.updateOutput(
            userId = 1L,
            workspaceId = 100L,
            outputId = 40L,
            request = UpdateOutputRequest(
                title = "Updated title",
                content = "Updated content",
                taskIds = listOf(10L),
                logIds = listOf(20L),
            ),
        )

        assertThat(output.title).isEqualTo("Updated title")
        assertThat(output.content).isEqualTo("Updated content")
        assertThat(response.tasks.single().id).isEqualTo(10L)
        assertThat(response.logs.single().id).isEqualTo(20L)
        @Suppress("UNCHECKED_CAST")
        val taskLinksCaptor =
            ArgumentCaptor.forClass(Iterable::class.java) as ArgumentCaptor<Iterable<OutputTask>>
        @Suppress("UNCHECKED_CAST")
        val logLinksCaptor =
            ArgumentCaptor.forClass(Iterable::class.java) as ArgumentCaptor<Iterable<OutputLog>>
        verify(outputTaskRepository).deleteAll(listOf(oldTaskLink))
        verify(outputLogRepository).deleteAll(listOf(oldLogLink))
        verify(outputTaskRepository).saveAll(taskLinksCaptor.capture())
        verify(outputLogRepository).saveAll(logLinksCaptor.capture())
        assertThat(taskLinksCaptor.value.single().task.id).isEqualTo(10L)
        assertThat(logLinksCaptor.value.single().log.id).isEqualTo(20L)
    }

    @Test
    fun `publishOutput creates post and marks output published`() {
        val output = WorkspaceOutput(
            id = 40L,
            workspace = workspace,
            author = user,
            title = "Publish me",
            content = "Ready content",
        )
        given(workspaceAccessResolver.requireOwnedWorkspace(1L, 100L)).willReturn(workspace)
        given(workspaceOutputRepository.findById(40L)).willReturn(Optional.of(output))
        given(postRepository.findByOutputId(40L)).willReturn(null)
        given(
            postService.createPostFromOutput(
                user = user,
                output = output,
                description = "Public summary",
                topics = listOf("output"),
            )
        ).willReturn(PostWriteResponse(authorUsername = "alice", slug = "publish-me"))
        given(outputTaskRepository.findAllByOutputId(40L)).willReturn(emptyList())
        given(outputLogRepository.findAllByOutputId(40L)).willReturn(emptyList())

        val response = outputService.publishOutput(
            user = user,
            workspaceId = 100L,
            outputId = 40L,
            request = PublishOutputRequest(
                description = "Public summary",
                topics = listOf("output"),
            ),
        )

        assertThat(output.status).isEqualTo(OutputStatus.PUBLISHED)
        assertThat(output.publishedAt).isNotNull()
        assertThat(response.status).isEqualTo(OutputStatus.PUBLISHED)
        verify(postService).createPostFromOutput(user, output, "Public summary", listOf("output"))
    }

    @Test
    fun `published output cannot be updated`() {
        val output = WorkspaceOutput(
            id = 40L,
            workspace = workspace,
            author = user,
            title = "Published",
            content = "Content",
        )
        output.markPublished()
        given(workspaceAccessResolver.requireOwnedWorkspace(1L, 100L)).willReturn(workspace)
        given(workspaceOutputRepository.findById(40L)).willReturn(Optional.of(output))

        assertThatThrownBy {
            outputService.updateOutput(
                userId = 1L,
                workspaceId = 100L,
                outputId = 40L,
                request = UpdateOutputRequest(
                    title = "Next",
                    content = "Next",
                ),
            )
        }.isInstanceOf(BadRequestException::class.java)

        verify(outputTaskRepository, never()).findAllByOutputId(40L)
        verify(outputLogRepository, never()).findAllByOutputId(40L)
    }
}
