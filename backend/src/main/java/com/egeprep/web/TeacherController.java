package com.egeprep.web;

import com.egeprep.dto.TaskDtos;
import com.egeprep.dto.TopicDtos;
import com.egeprep.service.TeacherTaskService;
import com.egeprep.service.TopicService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teacher")
public class TeacherController {

    private final TeacherTaskService teacherTaskService;
    private final TopicService topicService;

    public TeacherController(TeacherTaskService teacherTaskService, TopicService topicService) {
        this.teacherTaskService = teacherTaskService;
        this.topicService = topicService;
    }

    @PostMapping("/subjects")
    public TopicDtos.SubjectSummary createSubject(@Valid @RequestBody TopicDtos.SubjectCreateRequest body) {
        return topicService.createSubject(body.name(), body.slug());
    }

    @PostMapping("/subjects/{subjectId}/topics")
    public TopicDtos.TopicSummary createTopic(
            @PathVariable Long subjectId,
            @Valid @RequestBody TopicDtos.TopicCreateRequest body
    ) {
        return topicService.createTopic(subjectId, body.name(), body.slug());
    }

    @PostMapping("/topics/{topicId}/subtopics")
    public TopicDtos.SubtopicSummary createSubtopic(
            @PathVariable Long topicId,
            @Valid @RequestBody TopicDtos.SubtopicCreateRequest body
    ) {
        return topicService.createSubtopic(topicId, body.name());
    }

    @GetMapping("/subtopics/{subtopicId}/tasks")
    public List<TaskDtos.TaskTeacherDto> listTasks(@PathVariable Long subtopicId) {
        return teacherTaskService.listForSubtopic(subtopicId);
    }

    @PostMapping("/subtopics/{subtopicId}/tasks")
    public TaskDtos.TaskTeacherDto createTask(
            @PathVariable Long subtopicId,
            @Valid @RequestBody TaskDtos.TaskUpsertRequest body
    ) {
        return teacherTaskService.create(subtopicId, body);
    }

    @PutMapping("/tasks/{taskId}")
    public TaskDtos.TaskTeacherDto updateTask(
            @PathVariable Long taskId,
            @Valid @RequestBody TaskDtos.TaskUpsertRequest body
    ) {
        return teacherTaskService.update(taskId, body);
    }

    @DeleteMapping("/tasks/{taskId}")
    public void deleteTask(@PathVariable Long taskId) {
        teacherTaskService.delete(taskId);
    }
}
