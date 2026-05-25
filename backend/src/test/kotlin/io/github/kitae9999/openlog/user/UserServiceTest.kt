package io.github.kitae9999.openlog.user

import io.github.kitae9999.openlog.comment.repository.CommentCount
import io.github.kitae9999.openlog.comment.repository.CommentRepository
import io.github.kitae9999.openlog.common.cursor.DateTimeIdCursorCodec
import io.github.kitae9999.openlog.follow.FollowRepository
import io.github.kitae9999.openlog.post.entity.Post
import io.github.kitae9999.openlog.post.repository.PostLinkRepository
import io.github.kitae9999.openlog.post.repository.PostRepository
import io.github.kitae9999.openlog.postlike.PostLikeCount
import io.github.kitae9999.openlog.postlike.PostLikeRepository
import io.github.kitae9999.openlog.posttopic.repository.PostTopicRepository
import io.github.kitae9999.openlog.user.entity.User
import io.github.kitae9999.openlog.user.repository.UserRepository
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.BDDMockito.given
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.springframework.data.domain.PageRequest

@ExtendWith(MockitoExtension::class)
class UserServiceTest {
    @Mock
    private lateinit var userRepository: UserRepository

    @Mock
    private lateinit var postRepository: PostRepository

    @Mock
    private lateinit var postLinkRepository: PostLinkRepository

    @Mock
    private lateinit var postTopicRepository: PostTopicRepository

    @Mock
    private lateinit var postLikeRepository: PostLikeRepository

    @Mock
    private lateinit var commentRepository: CommentRepository

    @Mock
    private lateinit var followRepository: FollowRepository

    private lateinit var userService: UserService

    @BeforeEach
    fun setUp() {
        userService = UserService(
            userRepository = userRepository,
            postRepository = postRepository,
            postLinkRepository = postLinkRepository,
            postTopicRepository = postTopicRepository,
            postLikeRepository = postLikeRepository,
            commentRepository = commentRepository,
            followRepository = followRepository,
        )
    }

    @Test
    fun `getFollowingPosts returns first cursor page with capped page size`() {
        val author = User(
            id = 1L,
            username = "alice",
            nickname = "Alice",
            profileImageUrl = "https://example.com/alice.png",
        )
        val followingPosts = (1L..11L).map { id ->
            createPost(
                id = id,
                author = author,
                slug = "following-post-$id",
                title = "Following Post $id",
                content = "Content\n\n![Cover](https://example.com/$id.webp)",
            )
        }
        val pagePostIds = (1L..10L).toList()
        given(postRepository.findFollowingPostsByUserId(9L, PageRequest.of(0, 11)))
            .willReturn(followingPosts)
        given(postLikeRepository.countAllByPostIdIn(pagePostIds)).willReturn(
            listOf(object : PostLikeCount {
                override val postId = 1L
                override val count = 3L
            })
        )
        given(commentRepository.countAllByPostIdIn(pagePostIds)).willReturn(
            listOf(object : CommentCount {
                override val postId = 1L
                override val count = 2L
            })
        )

        val response = userService.getFollowingPosts(userId = 9L, cursor = null, size = 30)

        assertThat(response.size).isEqualTo(10)
        assertThat(response.posts).hasSize(10)
        assertThat(response.hasNext).isTrue()
        assertThat(response.nextCursor).isEqualTo(
            DateTimeIdCursorCodec.encode(followingPosts[9].createdAt, requireNotNull(followingPosts[9].id))
        )
        val summary = response.posts.first()
        assertThat(summary.id).isEqualTo(1L)
        assertThat(summary.slug).isEqualTo("following-post-1")
        assertThat(summary.authorUsername).isEqualTo("alice")
        assertThat(summary.authorName).isEqualTo("Alice")
        assertThat(summary.authorAvatarSrc).isEqualTo("https://example.com/alice.png")
        assertThat(summary.thumbnailSrc).isEqualTo("https://example.com/1.webp")
        assertThat(summary.likes).isEqualTo(3)
        assertThat(summary.comments).isEqualTo(2)
    }

    @Test
    fun `getFollowingPosts loads next cursor page`() {
        val author = User(id = 1L, username = "alice", nickname = "Alice")
        val cursorPost = createPost(
            id = 20L,
            author = author,
            slug = "cursor-post",
            title = "Cursor Post",
        )
        val nextPost = createPost(
            id = 19L,
            author = author,
            slug = "next-post",
            title = "Next Post",
        )
        val cursor = DateTimeIdCursorCodec.encode(cursorPost.createdAt, 20L)
        given(
            postRepository.findFollowingPostsAfterCursor(
                9L,
                cursorPost.createdAt,
                20L,
                PageRequest.of(0, 6),
            )
        ).willReturn(listOf(nextPost))
        given(postLikeRepository.countAllByPostIdIn(listOf(19L))).willReturn(emptyList())
        given(commentRepository.countAllByPostIdIn(listOf(19L))).willReturn(emptyList())

        val response = userService.getFollowingPosts(userId = 9L, cursor = cursor, size = 5)

        assertThat(response.posts.single().id).isEqualTo(19L)
        assertThat(response.nextCursor).isNull()
        assertThat(response.hasNext).isFalse()
    }

    private fun createPost(
        id: Long,
        author: User,
        slug: String,
        title: String,
        content: String = "Content",
    ): Post {
        return Post(
            id = id,
            author = author,
            slug = slug,
            title = title,
            description = "$title description",
            content = content,
        )
    }
}
