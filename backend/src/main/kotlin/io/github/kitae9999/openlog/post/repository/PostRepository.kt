package io.github.kitae9999.openlog.post.repository

import io.github.kitae9999.openlog.post.entity.Post
import org.springframework.data.jpa.repository.JpaRepository

interface PostRepository: JpaRepository<Post, Long> {
}