package com.egeprep.web;

import com.egeprep.dto.TopicDtos;
import com.egeprep.service.TopicService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/subtopics")
public class SubtopicController {

    private final TopicService topicService;

    public SubtopicController(TopicService topicService) {
        this.topicService = topicService;
    }

    @GetMapping("/{id}")
    public TopicDtos.SubtopicContext get(@PathVariable Long id) {
        return topicService.getSubtopicContext(id);
    }
}
