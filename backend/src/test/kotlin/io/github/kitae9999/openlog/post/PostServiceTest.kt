package io.github.kitae9999.openlog.post

import io.github.kitae9999.openlog.common.exception.ForbiddenException
import io.github.kitae9999.openlog.common.exception.NotFoundException
import io.github.kitae9999.openlog.post.command.PostWriteCommand
import io.github.kitae9999.openlog.post.entity.Post
import io.github.kitae9999.openlog.post.repository.PostRepository
import io.github.kitae9999.openlog.posttopic.entity.PostTopic
import io.github.kitae9999.openlog.posttopic.repository.PostTopicRepository
import io.github.kitae9999.openlog.suggest.repository.SuggestionRepository
import io.github.kitae9999.openlog.topic.entity.Topic
import io.github.kitae9999.openlog.topic.repository.TopicRepository
import io.github.kitae9999.openlog.user.entity.User
import io.github.kitae9999.openlog.user.repository.UserRepository
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Assertions.assertThrows
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
import org.mockito.Mockito.verifyNoMoreInteractions
import org.mockito.junit.jupiter.MockitoExtension
import java.util.Optional

@ExtendWith(MockitoExtension::class)
class PostServiceTest {
    @Mock
    private lateinit var postRepository: PostRepository

    @Mock
    private lateinit var postTopicRepository: PostTopicRepository

    @Mock
    private lateinit var suggestionRepository: SuggestionRepository

    @Mock
    private lateinit var topicRepository: TopicRepository

    @Mock
    private lateinit var userRepository: UserRepository

    private lateinit var postService: PostService

    @BeforeEach
    fun setUp() {
        postService = PostService(
            postRepository = postRepository,
            postTopicRepository = postTopicRepository,
            suggestionRepository = suggestionRepository,
            topicRepository = topicRepository,
            userRepository = userRepository,
        )
    }

    @Test
    fun `createPost saves post without blog dependency`() {
        val user = User(id = 1L, username = "alice")
        given(userRepository.findById(1L)).willReturn(Optional.of(user))
        given(postRepository.existsByAuthorIdAndSlug(1L, "hello-openlog")).willReturn(false)
        given(postRepository.save(any(Post::class.java))).willAnswer { invocation -> invocation.getArgument(0) }

        val response = postService.createPost(1L, createRequest())

        val postCaptor = ArgumentCaptor.forClass(Post::class.java)
        verify(postRepository).save(postCaptor.capture())
        verifyNoInteractions(topicRepository, postTopicRepository)

        assertThat(response.authorUsername).isEqualTo("alice")
        assertThat(response.slug).isEqualTo("hello-openlog")
        assertThat(postCaptor.value.author).isSameAs(user)
        assertThat(postCaptor.value.slug).isEqualTo("hello-openlog")
        assertThat(postCaptor.value.title).isEqualTo("Hello OpenLog")
    }

    @Test
    fun `createPost appends numeric suffix when author slug already exists`() {
        val user = User(id = 1L, username = "alice")
        given(userRepository.findById(1L)).willReturn(Optional.of(user))
        given(postRepository.existsByAuthorIdAndSlug(1L, "hello-openlog")).willReturn(true)
        given(postRepository.existsByAuthorIdAndSlug(1L, "hello-openlog-2")).willReturn(false)
        given(postRepository.save(any(Post::class.java))).willAnswer { invocation -> invocation.getArgument(0) }

        val response = postService.createPost(1L, createRequest())

        assertThat(response.slug).isEqualTo("hello-openlog-2")
    }

    @Test
    fun `createPost rejects users without username`() {
        val user = User(id = 1L, username = " ")
        given(userRepository.findById(1L)).willReturn(Optional.of(user))

        val exception = assertThrows(NotFoundException::class.java) {
            postService.createPost(1L, createRequest())
        }

        verify(postRepository, never()).save(any(Post::class.java))
        verifyNoInteractions(topicRepository, postTopicRepository)
        assertThat(exception.message).isEqualTo("username이 설정된 사용자를 찾을 수 없습니다.")
    }

    @Test
    fun `updatePost deletes existing topics when request sends empty topic list`() {
        val user = User(id = 1L, username = "alice")
        val post = Post(
            id = 10L,
            author = user,
            slug = "hello-openlog",
            title = "Hello OpenLog",
            description = "Removing blog ownership from posts",
            content = "content",
        )
        val existingPostTopics = listOf(
            PostTopic(
                post = post,
                topic = Topic(id = 20L, name = "kotlin"),
            )
        )
        given(postRepository.findById(10L)).willReturn(Optional.of(post))
        given(postTopicRepository.findAllByPostId(10L)).willReturn(existingPostTopics)

        postService.updatePost(1L, 10L, createRequest())

        verify(postTopicRepository).deleteAll(existingPostTopics)
        verifyNoInteractions(topicRepository)
        assertThat(post.version).isEqualTo(1L)
    }

    @Test
    fun `updatePost keeps topics unchanged when existing and request topics are both empty`() {
        val user = User(id = 1L, username = "alice")
        val post = Post(
            id = 10L,
            author = user,
            slug = "hello-openlog",
            title = "Hello OpenLog",
            description = "Removing blog ownership from posts",
            content = "content",
        )
        val originalUpdatedAt = post.updatedAt
        given(postRepository.findById(10L)).willReturn(Optional.of(post))
        given(postTopicRepository.findAllByPostId(10L)).willReturn(emptyList())

        postService.updatePost(1L, 10L, createRequest())

        verify(postTopicRepository).findAllByPostId(10L)
        verifyNoMoreInteractions(postTopicRepository)
        verifyNoInteractions(topicRepository)
        assertThat(post.updatedAt).isEqualTo(originalUpdatedAt)
        assertThat(post.version).isEqualTo(0L)
    }

    @Test
    fun `updatePost regenerates slug when title changes`() {
        val user = User(id = 1L, username = "alice")
        val post = Post(
            id = 10L,
            author = user,
            slug = "hello-openlog",
            title = "Hello OpenLog",
            description = "Removing blog ownership from posts",
            content = "content",
        )
        given(postRepository.findById(10L)).willReturn(Optional.of(post))
        given(postRepository.existsByAuthorIdAndSlugAndIdNot(1L, "updated-title", 10L)).willReturn(false)
        given(postTopicRepository.findAllByPostId(10L)).willReturn(emptyList())

        val response = postService.updatePost(
            1L,
            10L,
            createRequest(title = "Updated Title"),
        )

        assertThat(response.authorUsername).isEqualTo("alice")
        assertThat(response.slug).isEqualTo("updated-title")
        assertThat(post.slug).isEqualTo("updated-title")
        assertThat(post.version).isEqualTo(1L)
    }

    @Test
    fun `updatePost appends slug suffix excluding current post`() {
        val user = User(id = 1L, username = "alice")
        val post = Post(
            id = 10L,
            author = user,
            slug = "hello-openlog",
            title = "Hello OpenLog",
            description = "Removing blog ownership from posts",
            content = "content",
        )
        given(postRepository.findById(10L)).willReturn(Optional.of(post))
        given(postRepository.existsByAuthorIdAndSlugAndIdNot(1L, "updated-title", 10L)).willReturn(true)
        given(postRepository.existsByAuthorIdAndSlugAndIdNot(1L, "updated-title-2", 10L)).willReturn(false)
        given(postTopicRepository.findAllByPostId(10L)).willReturn(emptyList())

        val response = postService.updatePost(
            1L,
            10L,
            createRequest(title = "Updated Title"),
        )

        assertThat(response.slug).isEqualTo("updated-title-2")
        assertThat(post.slug).isEqualTo("updated-title-2")
    }

    @Test
    fun `updatePost keeps slug when title is unchanged`() {
        val user = User(id = 1L, username = "alice")
        val post = Post(
            id = 10L,
            author = user,
            slug = "hello-openlog",
            title = "Hello OpenLog",
            description = "Removing blog ownership from posts",
            content = "content",
        )
        given(postRepository.findById(10L)).willReturn(Optional.of(post))
        given(postTopicRepository.findAllByPostId(10L)).willReturn(emptyList())

        val response = postService.updatePost(1L, 10L, createRequest())

        verify(postRepository, never()).existsByAuthorIdAndSlugAndIdNot(1L, "hello-openlog", 10L)
        assertThat(response.slug).isEqualTo("hello-openlog")
        assertThat(post.slug).isEqualTo("hello-openlog")
        assertThat(post.version).isEqualTo(0L)
    }

    @Test
    fun `updatePost rejects non-author`() {
        val user = User(id = 2L, username = "alice")
        val post = Post(
            id = 10L,
            author = user,
            slug = "hello-openlog",
            title = "Hello OpenLog",
            description = "Removing blog ownership from posts",
            content = "content",
        )
        given(postRepository.findById(10L)).willReturn(Optional.of(post))

        assertThrows(ForbiddenException::class.java) {
            postService.updatePost(1L, 10L, createRequest())
        }

        verifyNoInteractions(topicRepository, postTopicRepository)
    }

    @Test
    fun `deletePost rejects non-author`() {
        val user = User(id = 2L, username = "alice")
        val post = Post(
            id = 10L,
            author = user,
            slug = "hello-openlog",
            title = "Hello OpenLog",
            description = "Removing blog ownership from posts",
            content = "content",
        )
        given(postRepository.findById(10L)).willReturn(Optional.of(post))

        assertThrows(ForbiddenException::class.java) {
            postService.deletePost(1L, 10L)
        }

        verify(postRepository, never()).delete(post)
    }

    @Test
    fun `deletePost deletes authorized post`() {
        val user = User(id = 1L, username = "alice")
        val post = Post(
            id = 10L,
            author = user,
            slug = "hello-openlog",
            title = "Hello OpenLog",
            description = "Removing blog ownership from posts",
            content = "content",
        )
        given(postRepository.findById(10L)).willReturn(Optional.of(post))

        postService.deletePost(1L, 10L)

        verify(postRepository).delete(post)
    }

    private fun createRequest(
        title: String = "Hello OpenLog",
        description: String = "Removing blog ownership from posts",
        content: String = "content",
        topics: List<String> = emptyList(),
    ) = PostWriteCommand(
        title = title,
        description = description,
        content = content,
        topics = topics,
    )
}
