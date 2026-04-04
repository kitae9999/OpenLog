package io.github.kitae9999.openlog.post

import io.github.kitae9999.openlog.common.exception.NotFoundException
import io.github.kitae9999.openlog.post.dto.CreatePostRequest
import io.github.kitae9999.openlog.post.entity.Post
import io.github.kitae9999.openlog.post.repository.PostRepository
import io.github.kitae9999.openlog.posttopic.repository.PostTopicRepository
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
import org.mockito.junit.jupiter.MockitoExtension
import java.util.Optional

@ExtendWith(MockitoExtension::class)
class PostServiceTest {
    @Mock
    private lateinit var postRepository: PostRepository

    @Mock
    private lateinit var postTopicRepository: PostTopicRepository

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

    private fun createRequest() = CreatePostRequest(
        title = "Hello OpenLog",
        description = "Removing blog ownership from posts",
        content = "content",
        topics = emptyList(),
    )
}
