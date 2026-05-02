package io.github.kitae9999.openlog.post

import io.github.kitae9999.openlog.common.exception.ForbiddenException
import io.github.kitae9999.openlog.common.exception.NotFoundException
import io.github.kitae9999.openlog.post.command.PostLinkWriteCommand
import io.github.kitae9999.openlog.post.command.PostWriteCommand
import io.github.kitae9999.openlog.post.entity.Post
import io.github.kitae9999.openlog.post.entity.PostLink
import io.github.kitae9999.openlog.post.repository.PostLinkRepository
import io.github.kitae9999.openlog.post.repository.PostRepository
import io.github.kitae9999.openlog.posttopic.entity.PostTopic
import io.github.kitae9999.openlog.posttopic.repository.PostTopicRepository
import io.github.kitae9999.openlog.suggest.repository.SuggestionRepository
import io.github.kitae9999.openlog.topic.entity.Topic
import io.github.kitae9999.openlog.topic.repository.TopicRepository
import io.github.kitae9999.openlog.user.entity.User
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.ArgumentCaptor
import org.mockito.ArgumentMatchers.any
import org.mockito.ArgumentMatchers.anyLong
import org.mockito.BDDMockito.given
import org.mockito.Mock
import org.mockito.Mockito.lenient
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
    private lateinit var postLinkRepository: PostLinkRepository

    @Mock
    private lateinit var postTopicRepository: PostTopicRepository

    @Mock
    private lateinit var suggestionRepository: SuggestionRepository

    @Mock
    private lateinit var topicRepository: TopicRepository

    private lateinit var postService: PostService

    @BeforeEach
    fun setUp() {
        postService = PostService(
            postRepository = postRepository,
            postLinkRepository = postLinkRepository,
            postTopicRepository = postTopicRepository,
            suggestionRepository = suggestionRepository,
            topicRepository = topicRepository,
        )
        lenient().`when`(postLinkRepository.findAllBySourcePostId(anyLong())).thenReturn(emptyList())
    }

    @Test
    fun `createPost saves post without blog dependency`() {
        val user = User(id = 1L, username = "alice")
        given(postRepository.existsByAuthorIdAndSlug(1L, "hello-openlog")).willReturn(false)
        given(postRepository.save(any(Post::class.java))).willAnswer { invocation -> invocation.getArgument(0) }

        val response = postService.createPost(user, createRequest())

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
        given(postRepository.existsByAuthorIdAndSlug(1L, "hello-openlog")).willReturn(true)
        given(postRepository.existsByAuthorIdAndSlug(1L, "hello-openlog-2")).willReturn(false)
        given(postRepository.save(any(Post::class.java))).willAnswer { invocation -> invocation.getArgument(0) }

        val response = postService.createPost(user, createRequest())

        assertThat(response.slug).isEqualTo("hello-openlog-2")
    }

    @Test
    fun `createPost saves selected wiki links`() {
        val user = User(id = 1L, username = "alice")
        val targetPost = Post(
            id = 20L,
            author = user,
            slug = "target-post",
            title = "Target Post",
            description = "target",
            content = "target content",
        )
        given(postRepository.existsByAuthorIdAndSlug(1L, "source-post")).willReturn(false)
        given(postRepository.save(any(Post::class.java))).willAnswer { invocation ->
            val post = invocation.getArgument<Post>(0)
            Post(
                id = 10L,
                author = post.author,
                slug = post.slug,
                title = post.title,
                description = post.description,
                content = post.content,
            )
        }
        given(postRepository.findByAuthorIdAndSlug(1L, "target-post")).willReturn(targetPost)

        postService.createPost(
            user,
            createRequest(
                title = "Source Post",
                content = "Read [[Target Post]] next.",
                links = listOf(PostLinkWriteCommand(label = "Target Post", targetSlug = "target-post")),
            ),
        )

        val links = captureSavedLinks()
        assertThat(links).hasSize(1)
        assertThat(links.single().sourcePost.id).isEqualTo(10L)
        assertThat(links.single().targetPost.id).isEqualTo(20L)
        assertThat(links.single().label).isEqualTo("Target Post")
    }

    @Test
    fun `updatePost replaces stale wiki links`() {
        val user = User(id = 1L, username = "alice")
        val sourcePost = Post(
            id = 10L,
            author = user,
            slug = "source-post",
            title = "Source Post",
            description = "source",
            content = "old content",
        )
        val oldTarget = Post(
            id = 19L,
            author = user,
            slug = "old-post",
            title = "Old Post",
            description = "old",
            content = "old",
        )
        val newTarget = Post(
            id = 20L,
            author = user,
            slug = "new-post",
            title = "New Post",
            description = "new",
            content = "new",
        )
        val staleLink = PostLink(sourcePost = sourcePost, targetPost = oldTarget, label = "Old Post")
        given(postRepository.findById(10L)).willReturn(Optional.of(sourcePost))
        given(postTopicRepository.findAllByPostId(10L)).willReturn(emptyList())
        given(postLinkRepository.findAllBySourcePostId(10L)).willReturn(listOf(staleLink))
        given(postRepository.findByAuthorIdAndSlug(1L, "new-post")).willReturn(newTarget)

        postService.updatePost(
            1L,
            10L,
            createRequest(
                title = "Source Post",
                description = "source",
                content = "Read [[New Post]] next.",
                links = listOf(PostLinkWriteCommand(label = "New Post", targetSlug = "new-post")),
            ),
        )

        verify(postLinkRepository).deleteAllBySourcePostId(10L)
        verify(postLinkRepository).flush()
        val links = captureSavedLinks()
        assertThat(links).hasSize(1)
        assertThat(links.single().targetPost.id).isEqualTo(20L)
        assertThat(links.single().label).isEqualTo("New Post")
    }

    @Test
    fun `updatePost flushes deleted links before inserting multiple new links`() {
        val user = User(id = 1L, username = "alice")
        val sourcePost = Post(
            id = 10L,
            author = user,
            slug = "source-post",
            title = "Source Post",
            description = "source",
            content = "old content",
        )
        val firstTarget = Post(
            id = 20L,
            author = user,
            slug = "first-target",
            title = "First Target",
            description = "first",
            content = "first",
        )
        val secondTarget = Post(
            id = 21L,
            author = user,
            slug = "second-target",
            title = "Second Target",
            description = "second",
            content = "second",
        )
        val staleLink = PostLink(sourcePost = sourcePost, targetPost = firstTarget, label = "Old First Target")
        given(postRepository.findById(10L)).willReturn(Optional.of(sourcePost))
        given(postTopicRepository.findAllByPostId(10L)).willReturn(emptyList())
        given(postLinkRepository.findAllBySourcePostId(10L)).willReturn(listOf(staleLink))
        given(postRepository.findByAuthorIdAndSlug(1L, "first-target")).willReturn(firstTarget)
        given(postRepository.findByAuthorIdAndSlug(1L, "second-target")).willReturn(secondTarget)

        postService.updatePost(
            1L,
            10L,
            createRequest(
                title = "Source Post",
                description = "source",
                content = "Read [[First Target]] and [[Second Target]].",
                links = listOf(
                    PostLinkWriteCommand(label = "First Target", targetSlug = "first-target"),
                    PostLinkWriteCommand(label = "Second Target", targetSlug = "second-target"),
                ),
            ),
        )

        verify(postLinkRepository).deleteAllBySourcePostId(10L)
        verify(postLinkRepository).flush()
        val links = captureSavedLinks()
        assertThat(links).hasSize(2)
        assertThat(links.map { it.targetPost.id }).containsExactlyInAnyOrder(20L, 21L)
        assertThat(links.map { it.label }).containsExactlyInAnyOrder("First Target", "Second Target")
    }

    @Test
    fun `submitted wiki target resolves ambiguous titles`() {
        val user = User(id = 1L, username = "alice")
        val selectedTarget = Post(
            id = 20L,
            author = user,
            slug = "selected",
            title = "Same Title",
            description = "selected",
            content = "selected",
        )
        given(postRepository.existsByAuthorIdAndSlug(1L, "source-post")).willReturn(false)
        given(postRepository.save(any(Post::class.java))).willAnswer { invocation ->
            val post = invocation.getArgument<Post>(0)
            Post(
                id = 10L,
                author = post.author,
                slug = post.slug,
                title = post.title,
                description = post.description,
                content = post.content,
            )
        }
        given(postRepository.findByAuthorIdAndSlug(1L, "selected")).willReturn(selectedTarget)

        postService.createPost(
            user,
            createRequest(
                title = "Source Post",
                content = "[[Same Title]]",
                links = listOf(PostLinkWriteCommand(label = "Same Title", targetSlug = "selected")),
            ),
        )

        val links = captureSavedLinks()
        assertThat(links.single().targetPost.slug).isEqualTo("selected")
        verify(postRepository, never()).findAllByAuthorIdAndTitle(1L, "Same Title")
    }

    @Test
    fun `createPost allows multiple labels to the same target post`() {
        val user = User(id = 1L, username = "alice")
        val targetPost = Post(
            id = 20L,
            author = user,
            slug = "target-post",
            title = "Target Post",
            description = "target",
            content = "target content",
        )
        given(postRepository.existsByAuthorIdAndSlug(1L, "source-post")).willReturn(false)
        given(postRepository.save(any(Post::class.java))).willAnswer { invocation ->
            val post = invocation.getArgument<Post>(0)
            Post(
                id = 10L,
                author = post.author,
                slug = post.slug,
                title = post.title,
                description = post.description,
                content = post.content,
            )
        }
        given(postRepository.findByAuthorIdAndSlug(1L, "target-post")).willReturn(targetPost)

        postService.createPost(
            user,
            createRequest(
                title = "Source Post",
                content = "Read [[Target Post]] and [[Target Alias]].",
                links = listOf(
                    PostLinkWriteCommand(label = "Target Post", targetSlug = "target-post"),
                    PostLinkWriteCommand(label = "Target Alias", targetSlug = "target-post"),
                ),
            ),
        )

        val links = captureSavedLinks()
        assertThat(links).hasSize(2)
        assertThat(links.map { it.targetPost.id }.toSet()).containsExactly(20L)
        assertThat(links.map { it.label }).containsExactlyInAnyOrder("Target Post", "Target Alias")
    }

    @Test
    fun `self links are ignored`() {
        val user = User(id = 1L, username = "alice")
        val sourcePost = Post(
            id = 10L,
            author = user,
            slug = "source-post",
            title = "Source Post",
            description = "source",
            content = "old content",
        )
        given(postRepository.findById(10L)).willReturn(Optional.of(sourcePost))
        given(postTopicRepository.findAllByPostId(10L)).willReturn(emptyList())
        given(postLinkRepository.findAllBySourcePostId(10L)).willReturn(emptyList())
        given(postRepository.findByAuthorIdAndSlug(1L, "source-post")).willReturn(sourcePost)

        postService.updatePost(
            1L,
            10L,
            createRequest(
                title = "Source Post",
                description = "source",
                content = "[[Source Post]]",
                links = listOf(PostLinkWriteCommand(label = "Source Post", targetSlug = "source-post")),
            ),
        )

        verify(postLinkRepository, never()).saveAll(any<Iterable<PostLink>>())
    }

    @Test
    fun `createPost rejects users without username`() {
        val user = User(id = 1L, username = " ")

        val exception = assertThrows(NotFoundException::class.java) {
            postService.createPost(user, createRequest())
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
        links: List<PostLinkWriteCommand> = emptyList(),
    ) = PostWriteCommand(
        title = title,
        description = description,
        content = content,
        topics = topics,
        links = links,
    )

    @Suppress("UNCHECKED_CAST")
    private fun captureSavedLinks(): List<PostLink> {
        val captor = ArgumentCaptor.forClass(Iterable::class.java) as ArgumentCaptor<Iterable<PostLink>>
        verify(postLinkRepository).saveAll(captor.capture())
        return captor.value.toList()
    }
}
