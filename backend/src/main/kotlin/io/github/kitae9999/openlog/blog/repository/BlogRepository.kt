package io.github.kitae9999.openlog.blog.repository

import io.github.kitae9999.openlog.blog.entity.Blog
import org.springframework.data.jpa.repository.JpaRepository

interface BlogRepository : JpaRepository<Blog, Long> {
    fun findByUserId(userId: Long): Blog?
}
