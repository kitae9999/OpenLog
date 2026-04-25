package io.github.kitae9999.openlog.suggest.dto

data class CreateSuggestionRequest(
    val title: String,
    val description: String,
    val content: String
)
