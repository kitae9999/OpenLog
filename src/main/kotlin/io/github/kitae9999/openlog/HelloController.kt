package io.github.kitae9999.openlog

import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController

@RestController
class HelloController {
    @GetMapping("/hello")
    fun hello() : String {
        return "hello, world!"
    }
}