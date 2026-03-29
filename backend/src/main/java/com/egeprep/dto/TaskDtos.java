package com.egeprep.dto;

import com.egeprep.model.TaskType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public class TaskDtos {

    public record TaskOptionDto(int orderIndex, String optionText) {
    }

    public record TaskPublicDto(
            Long id,
            Long subtopicId,
            String subtopicName,
            String topicName,
            TaskType type,
            String questionText,
            List<TaskOptionDto> options
    ) {
    }

    public record TaskTeacherDto(
            Long id,
            Long subtopicId,
            TaskType type,
            String questionText,
            Integer correctOptionIndex,
            List<String> correctAnswers,
            String explanation,
            List<TaskOptionDto> options
    ) {
    }

    public record TaskUpsertRequest(
            @NotNull TaskType type,
            @NotBlank String questionText,
            Integer correctOptionIndex,
            List<String> correctAnswers,
            String explanation,
            List<String> options
    ) {
    }

    public record VariantBuildRequest(
            @NotNull @Size(min = 1) List<Long> subtopicIds,
            @NotNull Integer taskCount
    ) {
    }

    public record VariantBuildResponse(List<TaskPublicDto> tasks) {
    }

    public record VariantAnswerItem(Long taskId, Integer selectedIndex, String textAnswer) {
    }

    public record VariantSubmitRequest(@NotNull List<VariantAnswerItem> answers) {
    }

    public record VariantResultItem(
            Long taskId,
            boolean correct,
            String explanation
    ) {
    }

    public record VariantSubmitResponse(int correctCount, int total, List<VariantResultItem> results) {
    }
}
