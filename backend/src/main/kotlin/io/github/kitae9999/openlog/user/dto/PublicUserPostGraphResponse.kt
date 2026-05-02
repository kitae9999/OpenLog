package io.github.kitae9999.openlog.user.dto

data class PublicUserPostGraphResponse(
    val nodes: List<PublicUserPostGraphNodeResponse>,
    val edges: List<PublicUserPostGraphEdgeResponse>,
)

data class PublicUserPostGraphNodeResponse(
    val slug: String,
    val title: String,
    val description: String,
)

data class PublicUserPostGraphEdgeResponse(
    val sourceSlug: String,
    val targetSlug: String,
    val label: String,
)
