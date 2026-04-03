package io.github.kitae9999.openlog.blog.repository

import io.github.kitae9999.openlog.blog.entity.Blog
import io.github.kitae9999.openlog.user.entity.User
import org.springframework.data.jpa.repository.JpaRepository

interface BlogRepository: JpaRepository<Blog, Long > {
    fun findByUser(user: User): MutableList<Blog>
}