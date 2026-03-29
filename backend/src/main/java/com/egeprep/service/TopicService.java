package com.egeprep.service;

import com.egeprep.dto.TopicDtos;
import com.egeprep.model.Subtopic;
import com.egeprep.model.Topic;
import com.egeprep.repo.SubtopicRepository;
import com.egeprep.repo.TaskRepository;
import com.egeprep.repo.TopicRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class TopicService {

    private final TopicRepository topicRepository;
    private final SubtopicRepository subtopicRepository;
    private final TaskRepository taskRepository;

    public TopicService(TopicRepository topicRepository, SubtopicRepository subtopicRepository, TaskRepository taskRepository) {
        this.topicRepository = topicRepository;
        this.subtopicRepository = subtopicRepository;
        this.taskRepository = taskRepository;
    }

    @Transactional(readOnly = true)
    public List<TopicDtos.TopicSummary> listTopics() {
        return topicRepository.findAll().stream()
                .sorted((a, b) -> Integer.compare(a.getSortOrder(), b.getSortOrder()))
                .map(t -> new TopicDtos.TopicSummary(
                        t.getId(),
                        t.getName(),
                        t.getSlug(),
                        t.getSortOrder(),
                        t.getSubtopics().size()
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public TopicDtos.TopicDetail getTopic(Long topicId) {
        Topic t = topicRepository.findById(topicId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Тема не найдена"));
        List<TopicDtos.SubtopicSummary> subs = subtopicRepository.findByTopicIdOrderBySortOrderAsc(topicId).stream()
                .map(s -> new TopicDtos.SubtopicSummary(
                        s.getId(),
                        t.getId(),
                        t.getName(),
                        s.getName(),
                        s.getSortOrder(),
                        taskRepository.countBySubtopicId(s.getId())
                ))
                .toList();
        return new TopicDtos.TopicDetail(t.getId(), t.getName(), t.getSlug(), t.getSortOrder(), subs);
    }

    @Transactional
    public TopicDtos.TopicSummary createTopic(String name, String slug) {
        String base = (slug == null || slug.isBlank()) ? name : slug;
        String cleanSlug = base.trim().toLowerCase()
                .replaceAll("\\s+", "-")
                .replaceAll("[^a-z0-9а-яё-]", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
        if (cleanSlug.isEmpty()) {
            cleanSlug = "topic-" + System.currentTimeMillis();
        }
        if (topicRepository.findBySlug(cleanSlug).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Такой slug уже есть");
        }
        int max = (int) topicRepository.count();
        Topic t = new Topic();
        t.setName(name.trim());
        t.setSlug(cleanSlug);
        t.setSortOrder(max);
        topicRepository.save(t);
        return new TopicDtos.TopicSummary(t.getId(), t.getName(), t.getSlug(), t.getSortOrder(), 0);
    }

    @Transactional
    public TopicDtos.SubtopicSummary createSubtopic(Long topicId, String name) {
        Topic topic = topicRepository.findById(topicId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        int ord = (int) subtopicRepository.findByTopicIdOrderBySortOrderAsc(topicId).size();
        Subtopic s = new Subtopic();
        s.setTopic(topic);
        s.setName(name.trim());
        s.setSortOrder(ord);
        subtopicRepository.save(s);
        return new TopicDtos.SubtopicSummary(
                s.getId(),
                topic.getId(),
                topic.getName(),
                s.getName(),
                s.getSortOrder(),
                0
        );
    }
}
