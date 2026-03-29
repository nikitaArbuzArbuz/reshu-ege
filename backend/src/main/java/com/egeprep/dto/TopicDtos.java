package com.egeprep.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.List;

public class TopicDtos {

    public record TopicCreateRequest(@NotBlank String name, String slug) {
    }

    public record SubtopicCreateRequest(@NotBlank String name) {
    }

    public record TopicSummary(Long id, String name, String slug, int sortOrder, int subtopicCount) {
    }

    public record SubtopicSummary(Long id, Long topicId, String topicName, String name, int sortOrder, long taskCount) {
    }

    public record TopicDetail(
            Long id,
            String name,
            String slug,
            int sortOrder,
            List<SubtopicSummary> subtopics
    ) {
    }
}
