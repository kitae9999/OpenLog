package io.github.kitae9999.openlog.post.command

data class PostWriteCommand(
    val title: String,
    val description: String,
    val content: String,
    val topics : List<String>,
)
