package io.github.kitae9999.openlog.post

import io.github.kitae9999.openlog.post.entity.Post
import java.time.format.DateTimeFormatter

private val PUBLISHED_AT_FORMATTER = DateTimeFormatter.ofPattern("yyyy. M. d.")

fun formatPublishedAtLabel(post: Post): String = post.createdAt.format(PUBLISHED_AT_FORMATTER)

fun extractFirstMarkdownImageSrc(content: String): String? {
    val imageSrc = MARKDOWN_IMAGE_PATTERN.find(content)
        ?.groupValues
        ?.getOrNull(1)
        ?.trim()

    return imageSrc?.takeIf {
        it.isNotEmpty() &&
            !it.startsWith("uploading://") &&
            !it.startsWith("upload-failed://")
    }
}

fun resolveAuthorName(post: Post): String {
    val author = post.author
    return when {
        !author.nickname.isNullOrBlank() -> author.nickname.orEmpty()
        !author.username.isNullOrBlank() -> author.username.orEmpty()
        !author.email.isNullOrBlank() -> author.email.orEmpty()
        else -> "OpenLog member"
    }
}

private val MARKDOWN_IMAGE_PATTERN = Regex("""!\[[^\]]*\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)""")
