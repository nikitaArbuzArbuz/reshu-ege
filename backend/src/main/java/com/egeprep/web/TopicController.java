package com.egeprep.web;

import com.egeprep.dto.TopicDtos;
import com.egeprep.service.TopicService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/topics")
public class TopicController {

    private final TopicService topicService;

    public TopicController(TopicService topicService) {
        this.topicService = topicService;
    }

    @GetMapping("/{id}")
    public TopicDtos.TopicDetail get(@PathVariable Long id) {
        return topicService.getTopic(id);
    }
}
