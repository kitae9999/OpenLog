package io.github.kitae9999.openlog.user

import io.github.kitae9999.openlog.comment.CommentMapper
import io.github.kitae9999.openlog.comment.entity.Comment
import io.github.kitae9999.openlog.discussion.DiscussionMapper
import io.github.kitae9999.openlog.discussion.entity.Discussion
import io.github.kitae9999.openlog.follow.FollowMapper
import io.github.kitae9999.openlog.post.PostMapper
import io.github.kitae9999.openlog.post.entity.Post
import io.github.kitae9999.openlog.suggest.SuggestionMapper
import io.github.kitae9999.openlog.suggest.entity.Suggestion
import io.github.kitae9999.openlog.user.entity.User
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

class OfficialBadgeMapperTest {
    @Test
    fun `user responses expose official account status and default regular accounts to false`() {
        val officialUser = officialUser()
        val regularUser = User(id = 2L, username = "alice", nickname = "Alice")

        val profile = UserMapper().toPublicProfileResponse(
            user = officialUser,
            following = false,
            followersCount = 0,
            followingCount = 0,
        )
        val officialFollowUser = FollowMapper().toUserResponse(officialUser)
        val regularFollowUser = FollowMapper().toUserResponse(regularUser)

        assertThat(profile.isOpenLogOfficial).isTrue()
        assertThat(officialFollowUser.isOpenLogOfficial).isTrue()
        assertThat(regularFollowUser.isOpenLogOfficial).isFalse()
    }

    @Test
    fun `post responses expose official author status`() {
        val post = postBy(officialUser())
        val mapper = PostMapper()

        val recent = mapper.toRecentPostResponse(post, likeCount = 0, commentCount = 0)
        val detail = mapper.toDetailResponse(
            post = post,
            topics = emptyList(),
            wikiLinks = emptyList(),
            likes = 0,
            liked = false,
        )

        assertThat(recent.authorIsOpenLogOfficial).isTrue()
        assertThat(detail.authorIsOpenLogOfficial).isTrue()
    }

    @Test
    fun `public conversations expose official author status`() {
        val officialUser = officialUser()
        val post = postBy(officialUser)
        val suggestion = Suggestion(
            id = 20L,
            post = post,
            user = officialUser,
            title = "Improve the guide",
            content = "Updated content",
            baseContent = "Original content",
            description = "A clearer explanation",
            postBaseVersion = 0,
        )
        val discussion = Discussion(
            id = 30L,
            suggestion = suggestion,
            user = officialUser,
            content = "Thanks for the suggestion",
        )
        val comment = Comment(
            id = 40L,
            post = post,
            user = officialUser,
            content = "Welcome to OpenLog",
        )
        val discussionMapper = DiscussionMapper()
        val suggestionMapper = SuggestionMapper(discussionMapper)

        val commentResponse = CommentMapper().toResponse(comment, userId = null)
        val discussionResponse = discussionMapper.toResponse(discussion, currentUserId = null)
        val suggestionSummary = suggestionMapper.toSummaryResponse(suggestion, commentCount = 1)
        val suggestionDetail = suggestionMapper.toDetailResponse(
            suggestion = suggestion,
            discussions = listOf(discussion),
            currentUserId = null,
        )

        assertThat(commentResponse.authorIsOpenLogOfficial).isTrue()
        assertThat(discussionResponse.authorIsOpenLogOfficial).isTrue()
        assertThat(suggestionSummary.authorIsOpenLogOfficial).isTrue()
        assertThat(suggestionDetail.authorIsOpenLogOfficial).isTrue()
        assertThat(suggestionDetail.discussions.single().authorIsOpenLogOfficial).isTrue()
    }

    private fun officialUser(): User {
        return User(
            id = 1L,
            username = "openlog",
            nickname = "Team OpenLog",
            isOpenLogOfficial = true,
        )
    }

    private fun postBy(author: User): Post {
        return Post(
            id = 10L,
            author = author,
            slug = "welcome-to-openlog",
            title = "Welcome to OpenLog",
            description = "Why we built OpenLog",
            content = "Post content",
        )
    }
}
