package io.github.kitae9999.openlog.todo

import io.github.kitae9999.openlog.common.exception.BadRequestException
import io.github.kitae9999.openlog.todo.repository.TodoRepository
import io.github.kitae9999.openlog.workspace.WorkspaceAccessResolver
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.BDDMockito.given
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import java.time.LocalDate

@ExtendWith(MockitoExtension::class)
class TodoServiceTest {
    @Mock private lateinit var repository: TodoRepository
    @Mock private lateinit var accessResolver: WorkspaceAccessResolver
    private lateinit var service: TodoService

    @BeforeEach
    fun setUp() {
        service = TodoService(repository, accessResolver, TodoMapper())
    }

    @Test
    fun `getAllTodos returns workspace todos without date filter`() {
        given(
            repository.findAllByWorkspaceIdOrderByDoneAscPlannedForAscSortOrderAscIdAsc(10L),
        ).willReturn(emptyList())

        val response = service.getAllTodos(1L, 10L)

        assertThat(response).isEmpty()
    }

    @Test
    fun `getTodosInRange returns todos ordered by repository query`() {
        val from = LocalDate.of(2026, 7, 1)
        val to = LocalDate.of(2026, 7, 31)
        given(
            repository.findAllByWorkspaceIdAndPlannedForBetweenOrderByPlannedForAscSortOrderAscIdAsc(
                10L,
                from,
                to,
            )
        ).willReturn(emptyList())

        val response = service.getTodosInRange(1L, 10L, from, to)

        assertThat(response).isEmpty()
    }

    @Test
    fun `getTodosInRange rejects reversed range`() {
        assertThatThrownBy {
            service.getTodosInRange(
                1L,
                10L,
                LocalDate.of(2026, 8, 1),
                LocalDate.of(2026, 7, 31),
            )
        }.isInstanceOf(BadRequestException::class.java)
    }

    @Test
    fun `getTodosInRange rejects more than 366 days`() {
        assertThatThrownBy {
            service.getTodosInRange(
                1L,
                10L,
                LocalDate.of(2025, 1, 1),
                LocalDate.of(2026, 1, 2),
            )
        }.isInstanceOf(BadRequestException::class.java)
    }
}
