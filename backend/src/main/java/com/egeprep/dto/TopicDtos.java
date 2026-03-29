package com.egeprep.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.List;

public class TopicDtos {

    public record SubjectCreateRequest(@NotBlank String name, String slug) {
    }

    public record TopicCreateRequest(@NotBlank String name, String slug) {
    }

    public record SubtopicCreateRequest(@NotBlank String name) {
    }

    public record SubjectSummary(Long id, String name, String slug, int sortOrder, int topicCount) {
    }

    public record SubtopicSummary(
            Long id,
            Long subjectId,
            String subjectName,
            Long topicId,
            String topicName,
            String name,
            int sortOrder,
            long taskCount
    ) {
    }

    public record TopicSummary(Long id, Long subjectId, String subjectName, String name, String slug, int sortOrder, int subtopicCount) {
    }

    public record TopicDetail(
            Long id,
            Long subjectId,
            String subjectName,
            String name,
            String slug,
            int sortOrder,
            List<SubtopicSummary> subtopics
    ) {
    }

    public record SubjectDetail(
            Long id,
            String name,
            String slug,
            int sortOrder,
            List<TopicDetail> topics
    ) {
    }

    public record SubtopicContext(
            Long id,
            Long topicId,
            Long subjectId,
            String subjectName,
            String topicName,
            String subtopicName
    ) {
    }
}
