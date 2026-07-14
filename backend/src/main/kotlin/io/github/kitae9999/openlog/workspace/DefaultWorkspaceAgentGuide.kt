package io.github.kitae9999.openlog.workspace

object DefaultWorkspaceAgentGuide {
    const val CONTENT = """# Workspace Agent Guide

## Workspace purpose

Use this section to describe what belongs in this workspace and what outcomes matter.

## What is worth recording

- Important technical or product decisions and their rationale
- Relevant problems, root causes, and verified fixes
- Reusable knowledge that will help future work
- Follow-up work that should remain visible after the current session
- Coherent deliverables assembled from completed work

## Choosing a document type

### Task

Use a Task for actionable work that still needs to be started, tracked, or completed. A Task should have a concrete goal and a meaningful completion state.

### Log

Use a Log to preserve an event or knowledge produced during work:

- ISSUE: a relevant problem was discovered
- FIX: a problem's cause and resolution were identified
- DECISION: a meaningful choice and its rationale should be preserved
- NOTE: reusable context does not fit another Log kind

Link a Log to the Task that produced it when applicable.

### Output

Use an Output for a coherent draft that synthesizes one or more Tasks and Logs into a result intended for review, sharing, or later publishing.

## When multiple types apply

- Use a Task as the work container.
- Add important findings and decisions as linked Logs.
- Create an Output only when the accumulated work needs to become a separate deliverable.
- Prefer updating or linking existing documents over creating duplicates.

## Do not record

- Routine file changes or command output
- Temporary errors with no lasting value
- Information already captured in OpenLog
- Raw conversation transcripts
- Secrets, credentials, or personal information
"""
}
