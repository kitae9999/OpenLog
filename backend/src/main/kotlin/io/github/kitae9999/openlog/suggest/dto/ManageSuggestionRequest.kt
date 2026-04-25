package io.github.kitae9999.openlog.suggest.dto

import io.github.kitae9999.openlog.suggest.entity.SuggestionAction

data class ManageSuggestionRequest(
    /**
     * MERGE, REJECT, CLOSE
     */
    val action: SuggestionAction
)

