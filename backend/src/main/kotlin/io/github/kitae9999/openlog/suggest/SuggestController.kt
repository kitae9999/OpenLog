package io.github.kitae9999.openlog.suggest

import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping()
class SuggestController(
    private val suggestService: SuggestService,
) {
    @GetMapping("/posts/{postId}/suggestions")
    fun getPostSuggestion(
        @PathVariable postId: Long
    ){
        return suggestService.getPostSuggestions(postId)
    }

    @PostMapping("/posts/{postId}/suggestions")
    fun createPostSuggestion(){

    }
}