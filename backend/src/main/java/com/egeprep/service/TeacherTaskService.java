package com.egeprep.service;

import com.egeprep.dto.TaskDtos;
import com.egeprep.model.*;
import com.egeprep.repo.SubtopicRepository;
import com.egeprep.repo.TaskRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.List;

@Service
public class TeacherTaskService {

    private static final int MC_OPTIONS_MIN = 2;
    private static final int MC_OPTIONS_MAX = 12;

    private final TaskRepository taskRepository;
    private final SubtopicRepository subtopicRepository;
    private final ObjectMapper objectMapper;

    public TeacherTaskService(TaskRepository taskRepository, SubtopicRepository subtopicRepository, ObjectMapper objectMapper) {
        this.taskRepository = taskRepository;
        this.subtopicRepository = subtopicRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<TaskDtos.TaskTeacherDto> listForSubtopic(Long subtopicId) {
        if (!subtopicRepository.existsById(subtopicId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        return taskRepository.findBySubtopicIdOrderByIdAsc(subtopicId).stream()
                .map(this::toTeacher)
                .toList();
    }

    @Transactional
    public TaskDtos.TaskTeacherDto create(Long subtopicId, TaskDtos.TaskUpsertRequest req) {
        Subtopic st = subtopicRepository.findById(subtopicId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        validate(req);
        Task t = new Task();
        t.setSubtopic(st);
        apply(t, req);
        addOptions(t, req);
        taskRepository.save(t);
        return toTeacher(taskRepository.findById(t.getId()).orElseThrow());
    }

    @Transactional
    public TaskDtos.TaskTeacherDto update(Long taskId, TaskDtos.TaskUpsertRequest req) {
        Task t = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        validate(req);
        apply(t, req);
        t.getOptions().clear();
        addOptions(t, req);
        taskRepository.save(t);
        return toTeacher(taskRepository.findById(taskId).orElseThrow());
    }

    @Transactional
    public void delete(Long taskId) {
        if (!taskRepository.existsById(taskId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        taskRepository.deleteById(taskId);
    }

    private void validate(TaskDtos.TaskUpsertRequest req) {
        if (req.type() == TaskType.MULTIPLE_CHOICE) {
            if (req.options() == null || req.options().size() < MC_OPTIONS_MIN || req.options().size() > MC_OPTIONS_MAX) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Число вариантов ответа: от " + MC_OPTIONS_MIN + " до " + MC_OPTIONS_MAX);
            }
            int maxIdx = req.options().size() - 1;
            if (req.correctOptionIndex() == null || req.correctOptionIndex() < 0 || req.correctOptionIndex() > maxIdx) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Укажите номер верного варианта в допустимом диапазоне");
            }
        } else if (req.type() == TaskType.TEXT) {
            if (req.correctAnswers() == null || req.correctAnswers().isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Укажите хотя бы один верный ответ");
            }
        }
    }

    private void apply(Task t, TaskDtos.TaskUpsertRequest req) {
        t.setType(req.type());
        t.setQuestionText(req.questionText().trim());
        t.setExplanation(req.explanation() != null ? req.explanation().trim() : null);
        if (req.type() == TaskType.MULTIPLE_CHOICE) {
            t.setCorrectOptionIndex(req.correctOptionIndex());
            t.setCorrectAnswersJson(null);
        } else {
            t.setCorrectOptionIndex(null);
            try {
                t.setCorrectAnswersJson(objectMapper.writeValueAsString(req.correctAnswers()));
            } catch (JsonProcessingException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Не удалось сохранить ответы");
            }
        }
    }

    private void addOptions(Task t, TaskDtos.TaskUpsertRequest req) {
        if (req.type() != TaskType.MULTIPLE_CHOICE) {
            return;
        }
        for (int i = 0; i < req.options().size(); i++) {
            TaskOption o = new TaskOption();
            o.setTask(t);
            o.setOrderIndex(i);
            o.setOptionText(req.options().get(i).trim());
            t.getOptions().add(o);
        }
    }

    private TaskDtos.TaskTeacherDto toTeacher(Task t) {
        List<TaskDtos.TaskOptionDto> opts = t.getOptions().stream()
                .sorted(Comparator.comparingInt(TaskOption::getOrderIndex))
                .map(o -> new TaskDtos.TaskOptionDto(o.getOrderIndex(), o.getOptionText()))
                .toList();
        List<String> correct = List.of();
        if (t.getCorrectAnswersJson() != null) {
            try {
                correct = objectMapper.readValue(t.getCorrectAnswersJson(), new com.fasterxml.jackson.core.type.TypeReference<>() {
                });
            } catch (Exception ignored) {
            }
        }
        return new TaskDtos.TaskTeacherDto(
                t.getId(),
                t.getSubtopic().getId(),
                t.getType(),
                t.getQuestionText(),
                t.getCorrectOptionIndex(),
                correct,
                t.getExplanation(),
                opts
        );
    }
}
