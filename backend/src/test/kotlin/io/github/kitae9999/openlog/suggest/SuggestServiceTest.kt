package io.github.kitae9999.openlog.suggest

import io.github.kitae9999.openlog.common.exception.BadRequestException
import io.github.kitae9999.openlog.common.exception.ForbiddenException
import io.github.kitae9999.openlog.post.entity.Post
import io.github.kitae9999.openlog.post.repository.PostRepository
import io.github.kitae9999.openlog.suggest.entity.Suggestion
import io.github.kitae9999.openlog.suggest.entity.SuggestionAction
import io.github.kitae9999.openlog.suggest.entity.SuggestionStatus
import io.github.kitae9999.openlog.suggest.repository.SuggestionRepository
import io.github.kitae9999.openlog.user.entity.User
import io.github.kitae9999.openlog.user.repository.UserRepository
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.BDDMockito.given
import org.mockito.Mock
import org.mockito.Mockito.never
import org.mockito.Mockito.verify
import org.mockito.junit.jupiter.MockitoExtension

@ExtendWith(MockitoExtension::class)
class SuggestServiceTest {
    @Mock
    private lateinit var userRepository: UserRepository

    @Mock
    private lateinit var postRepository: PostRepository

    @Mock
    private lateinit var suggestionRepository: SuggestionRepository

    private lateinit var suggestService: SuggestService

    @BeforeEach
    fun setUp() {
        suggestService = SuggestService(
            userRepository = userRepository,
            postRepository = postRepository,
            suggestionRepository = suggestionRepository,
        )
    }

    @Test
    fun `suggestion owner can close open suggestion`() {
        val suggestion = createSuggestion()
        givenManageableSuggestion(suggestion)

        suggestService.manageSuggestion(2L, 10L, 100L, SuggestionAction.CLOSE)

        assertThat(suggestion.status).isEqualTo(SuggestionStatus.CLOSED)
    }

    @Test
    fun `non owner cannot close suggestion`() {
        val suggestion = createSuggestion()
        givenManageableSuggestion(suggestion)

        assertThrows(ForbiddenException::class.java) {
            suggestService.manageSuggestion(3L, 10L, 100L, SuggestionAction.CLOSE)
        }

        assertThat(suggestion.status).isEqualTo(SuggestionStatus.OPEN)
    }

    @Test
    fun `post author can merge open suggestion`() {
        val suggestion = createSuggestion()
        givenManageableSuggestion(suggestion)

        suggestService.manageSuggestion(1L, 10L, 100L, SuggestionAction.MERGE)

        assertThat(suggestion.status).isEqualTo(SuggestionStatus.MERGED)
        assertThat(suggestion.post.content).isEqualTo("suggested content")
        assertThat(suggestion.post.version).isEqualTo(1L)
        verify(suggestionRepository).markOtherOpenSuggestionsOutdated(
            postId = 10L,
            excludedSuggestionId = 100L,
        )
    }

    @Test
    fun `non post author cannot merge suggestion`() {
        val suggestion = createSuggestion()
        givenManageableSuggestion(suggestion)

        assertThrows(ForbiddenException::class.java) {
            suggestService.manageSuggestion(2L, 10L, 100L, SuggestionAction.MERGE)
        }

        assertThat(suggestion.status).isEqualTo(SuggestionStatus.OPEN)
        verify(suggestionRepository, never()).markOtherOpenSuggestionsOutdated(10L, 100L)
    }

    @Test
    fun `post author can reject open suggestion`() {
        val suggestion = createSuggestion()
        givenManageableSuggestion(suggestion)

        suggestService.manageSuggestion(1L, 10L, 100L, SuggestionAction.REJECT)

        assertThat(suggestion.status).isEqualTo(SuggestionStatus.REJECTED)
    }

    @Test
    fun `non post author cannot reject suggestion`() {
        val suggestion = createSuggestion()
        givenManageableSuggestion(suggestion)

        assertThrows(ForbiddenException::class.java) {
            suggestService.manageSuggestion(2L, 10L, 100L, SuggestionAction.REJECT)
        }

        assertThat(suggestion.status).isEqualTo(SuggestionStatus.OPEN)
    }

    @Test
    fun `suggestion owner can update open suggestion`() {
        val suggestion = createSuggestion()
        givenManageableSuggestion(suggestion)

        suggestService.updateSuggestion(
            userId = 2L,
            postId = 10L,
            suggestionId = 100L,
            title = "updated title",
            description = "updated description",
            content = "updated content",
        )

        assertThat(suggestion.title).isEqualTo("updated title")
        assertThat(suggestion.description).isEqualTo("updated description")
        assertThat(suggestion.content).isEqualTo("updated content")
    }

    @Test
    fun `non owner cannot update suggestion`() {
        val suggestion = createSuggestion()
        givenManageableSuggestion(suggestion)

        assertThrows(ForbiddenException::class.java) {
            suggestService.updateSuggestion(
                userId = 3L,
                postId = 10L,
                suggestionId = 100L,
                title = "updated title",
                description = "updated description",
                content = "updated content",
            )
        }

        assertThat(suggestion.title).isEqualTo("suggestion title")
    }

    @Test
    fun `processed suggestion cannot be managed or edited`() {
        val suggestion = createSuggestion(status = SuggestionStatus.CLOSED)
        givenManageableSuggestion(suggestion)

        assertThrows(BadRequestException::class.java) {
            suggestService.manageSuggestion(2L, 10L, 100L, SuggestionAction.CLOSE)
        }
        assertThrows(BadRequestException::class.java) {
            suggestService.updateSuggestion(
                userId = 2L,
                postId = 10L,
                suggestionId = 100L,
                title = "updated title",
                description = "updated description",
                content = "updated content",
            )
        }
    }

    private fun givenManageableSuggestion(suggestion: Suggestion) {
        given(
            suggestionRepository.findManageableWithPostAuthorByIdAndPostId(
                suggestionId = 100L,
                postId = 10L,
            )
        ).willReturn(suggestion)
    }

    private fun createSuggestion(
        status: SuggestionStatus = SuggestionStatus.OPEN,
    ): Suggestion {
        val postAuthor = User(id = 1L, username = "author")
        val suggestionAuthor = User(id = 2L, username = "suggestor")
        val post = Post(
            id = 10L,
            author = postAuthor,
            slug = "hello-openlog",
            title = "Hello OpenLog",
            description = "post description",
            content = "base content",
        )

        return Suggestion(
            id = 100L,
            post = post,
            user = suggestionAuthor,
            title = "suggestion title",
            content = "suggested content",
            baseContent = "base content",
            description = "suggestion description",
            status = status,
            postBaseVersion = 0L,
        )
    }
}
