package com.egeprep.web;

import com.egeprep.dto.TopicDtos;
import com.egeprep.service.TopicService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subjects")
public class SubjectController {

    private final TopicService topicService;

    public SubjectController(TopicService topicService) {
        this.topicService = topicService;
    }

    @GetMapping
    public List<TopicDtos.SubjectSummary> list() {
        return topicService.listSubjects();
    }

    @GetMapping("/{id}")
    public TopicDtos.SubjectDetail get(@PathVariable Long id) {
        return topicService.getSubject(id);
    }
}
