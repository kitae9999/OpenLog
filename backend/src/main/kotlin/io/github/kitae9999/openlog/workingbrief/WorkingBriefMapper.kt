package io.github.kitae9999.openlog.workingbrief

import io.github.kitae9999.openlog.workingbrief.dto.WorkingBriefResponse
import io.github.kitae9999.openlog.workingbrief.entity.WorkspaceWorkingBrief
import org.springframework.stereotype.Component

@Component
class WorkingBriefMapper {
    fun toResponse(brief: WorkspaceWorkingBrief): WorkingBriefResponse {
        return WorkingBriefResponse(
            title = brief.title,
            prose = brief.prose,
            taskId = brief.task?.id,
            taskTitle = brief.task?.title,
            branch = brief.branch,
            updatedAt = brief.updatedAt.toString(),
        )
    }
}
