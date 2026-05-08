package io.github.kitae9999.openlog.notification

import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping
class NotificationController (
    private val notificationService: NotificationService
){
    
}