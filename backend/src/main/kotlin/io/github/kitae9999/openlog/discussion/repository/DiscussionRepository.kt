package io.github.kitae9999.openlog.discussion.repository

import io.github.kitae9999.openlog.discussion.entity.Discussion
import org.springframework.data.jpa.repository.JpaRepository

interface DiscussionRepository : JpaRepository<Discussion, Long>
