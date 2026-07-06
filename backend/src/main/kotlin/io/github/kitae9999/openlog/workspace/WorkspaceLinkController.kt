package io.github.kitae9999.openlog.workspace

import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
class WorkspaceLinkController (
    private val workspaceLinkService: WorkspaceLinkService
) {

}