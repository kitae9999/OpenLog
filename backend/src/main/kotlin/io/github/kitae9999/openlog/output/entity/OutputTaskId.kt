package io.github.kitae9999.openlog.output.entity

import jakarta.persistence.Column
import jakarta.persistence.Embeddable
import java.io.Serializable

@Embeddable
data class OutputTaskId(
    @Column(name = "output_id")
    val outputId: Long = 0L,
    @Column(name = "task_id")
    val taskId: Long = 0L,
) : Serializable
