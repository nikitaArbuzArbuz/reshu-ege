package com.egeprep.service;

import com.egeprep.dto.TaskDtos;
import com.egeprep.model.Task;
import com.egeprep.model.TaskOption;
import com.egeprep.model.TaskType;
import com.egeprep.repo.SubtopicRepository;
import com.egeprep.repo.TaskRepository;
import com.egeprep.util.AnswerNormalizer;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

@Service
public class VariantService {

    private final TaskRepository taskRepository;
    private final SubtopicRepository subtopicRepository;
    private final ObjectMapper objectMapper;

    public VariantService(TaskRepository taskRepository, SubtopicRepository subtopicRepository, ObjectMapper objectMapper) {
        this.taskRepository = taskRepository;
        this.subtopicRepository = subtopicRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public TaskDtos.VariantBuildResponse build(TaskDtos.VariantBuildRequest req) {
        boolean anyPositive = req.allocations().stream().anyMatch(a -> a.count() != null && a.count() > 0);
        if (!anyPositive) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Укажите число задач хотя бы по одной подтеме");
        }
        List<Task> picked = new ArrayList<>();
        for (TaskDtos.SubtopicAllocation a : req.allocations()) {
            int c = a.count() == null ? 0 : a.count();
            if (c <= 0) {
                continue;
            }
            if (!subtopicRepository.existsById(a.subtopicId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Подтема не найдена: " + a.subtopicId());
            }
            List<Task> pool = taskRepository.findBySubtopicIdIn(List.of(a.subtopicId()));
            if (pool.isEmpty()) {
                continue;
            }
            Collections.shuffle(pool);
            int n = Math.min(c, pool.size());
            picked.addAll(pool.subList(0, n));
        }
        if (picked.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Нет задач по выбранным подтемам");
        }
        Collections.shuffle(picked);
        List<TaskDtos.TaskPublicDto> dtos = picked.stream().map(this::toPublic).toList();
        return new TaskDtos.VariantBuildResponse(dtos);
    }

    private TaskDtos.TaskPublicDto toPublic(Task t) {
        String subjectName = t.getSubtopic().getTopic().getSubject().getName();
        String topicName = t.getSubtopic().getTopic().getName();
        String subtopicName = t.getSubtopic().getName();
        List<TaskDtos.TaskOptionDto> opts = t.getOptions().stream()
                .sorted(Comparator.comparingInt(TaskOption::getOrderIndex))
                .map(o -> new TaskDtos.TaskOptionDto(o.getOrderIndex(), o.getOptionText()))
                .toList();
        return new TaskDtos.TaskPublicDto(
                t.getId(),
                t.getSubtopic().getId(),
                subjectName,
                topicName,
                subtopicName,
                t.getType(),
                t.getQuestionText(),
                t.getType() == TaskType.MULTIPLE_CHOICE ? opts : List.of()
        );
    }

    @Transactional(readOnly = true)
    public TaskDtos.VariantSubmitResponse submit(TaskDtos.VariantSubmitRequest req) {
        List<TaskDtos.VariantResultItem> results = new ArrayList<>();
        int ok = 0;
        for (TaskDtos.VariantAnswerItem a : req.answers()) {
            Task t = taskRepository.findById(a.taskId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Задача " + a.taskId()));
            boolean correct = check(t, a);
            if (correct) {
                ok++;
            }
            results.add(new TaskDtos.VariantResultItem(t.getId(), correct, t.getExplanation()));
        }
        return new TaskDtos.VariantSubmitResponse(ok, results.size(), results);
    }

    private boolean check(Task t, TaskDtos.VariantAnswerItem a) {
        if (t.getType() == TaskType.MULTIPLE_CHOICE) {
            if (a.selectedIndex() == null) {
                return false;
            }
            return t.getCorrectOptionIndex() != null && t.getCorrectOptionIndex().equals(a.selectedIndex());
        }
        if (t.getType() == TaskType.TEXT) {
            if (a.textAnswer() == null) {
                return false;
            }
            List<String> allowed = parseAnswers(t.getCorrectAnswersJson());
            String user = AnswerNormalizer.normalize(a.textAnswer());
            for (String s : allowed) {
                if (user.equals(AnswerNormalizer.normalize(s))) {
                    return true;
                }
            }
            return false;
        }
        return false;
    }

    private List<String> parseAnswers(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<>() {
            });
        } catch (Exception e) {
            return List.of();
        }
    }
}
