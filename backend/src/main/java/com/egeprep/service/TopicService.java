package com.egeprep.service;

import com.egeprep.dto.TopicDtos;
import com.egeprep.model.Subject;
import com.egeprep.model.Subtopic;
import com.egeprep.model.Topic;
import com.egeprep.repo.SubjectRepository;
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

    private final SubjectRepository subjectRepository;
    private final TopicRepository topicRepository;
    private final SubtopicRepository subtopicRepository;
    private final TaskRepository taskRepository;

    public TopicService(
            SubjectRepository subjectRepository,
            TopicRepository topicRepository,
            SubtopicRepository subtopicRepository,
            TaskRepository taskRepository
    ) {
        this.subjectRepository = subjectRepository;
        this.topicRepository = topicRepository;
        this.subtopicRepository = subtopicRepository;
        this.taskRepository = taskRepository;
    }

    @Transactional(readOnly = true)
    public List<TopicDtos.SubjectSummary> listSubjects() {
        return subjectRepository.findAll().stream()
                .sorted((a, b) -> Integer.compare(a.getSortOrder(), b.getSortOrder()))
                .map(s -> new TopicDtos.SubjectSummary(
                        s.getId(),
                        s.getName(),
                        s.getSlug(),
                        s.getSortOrder(),
                        s.getTopics().size()
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public TopicDtos.SubjectDetail getSubject(Long subjectId) {
        Subject s = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Предмет не найден"));
        List<TopicDtos.TopicDetail> topics = topicRepository.findBySubjectIdOrderBySortOrderAsc(subjectId).stream()
                .map(this::toTopicDetail)
                .toList();
        return new TopicDtos.SubjectDetail(s.getId(), s.getName(), s.getSlug(), s.getSortOrder(), topics);
    }

    @Transactional(readOnly = true)
    public TopicDtos.SubtopicContext getSubtopicContext(Long subtopicId) {
        Subtopic st = subtopicRepository.findById(subtopicId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Подтема не найдена"));
        Topic t = st.getTopic();
        Subject s = t.getSubject();
        return new TopicDtos.SubtopicContext(
                st.getId(),
                t.getId(),
                s.getId(),
                s.getName(),
                t.getName(),
                st.getName()
        );
    }

    @Transactional(readOnly = true)
    public TopicDtos.TopicDetail getTopic(Long topicId) {
        Topic t = topicRepository.findById(topicId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Тема не найдена"));
        return toTopicDetail(t);
    }

    private TopicDtos.TopicDetail toTopicDetail(Topic t) {
        Subject s = t.getSubject();
        List<TopicDtos.SubtopicSummary> subs = subtopicRepository.findByTopicIdOrderBySortOrderAsc(t.getId()).stream()
                .map(st -> new TopicDtos.SubtopicSummary(
                        st.getId(),
                        s.getId(),
                        s.getName(),
                        t.getId(),
                        t.getName(),
                        st.getName(),
                        st.getSortOrder(),
                        taskRepository.countBySubtopicId(st.getId())
                ))
                .toList();
        return new TopicDtos.TopicDetail(
                t.getId(),
                s.getId(),
                s.getName(),
                t.getName(),
                t.getSlug(),
                t.getSortOrder(),
                subs
        );
    }

    @Transactional
    public TopicDtos.SubjectSummary createSubject(String name, String slug) {
        String base = (slug == null || slug.isBlank()) ? name : slug;
        String cleanSlug = slugify(base);
        if (subjectRepository.findBySlug(cleanSlug).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Такой slug предмета уже есть");
        }
        int ord = (int) subjectRepository.count();
        Subject s = new Subject();
        s.setName(name.trim());
        s.setSlug(cleanSlug);
        s.setSortOrder(ord);
        subjectRepository.save(s);
        return new TopicDtos.SubjectSummary(s.getId(), s.getName(), s.getSlug(), s.getSortOrder(), 0);
    }

    @Transactional
    public TopicDtos.TopicSummary createTopic(Long subjectId, String name, String slug) {
        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        String base = (slug == null || slug.isBlank()) ? name : slug;
        String cleanSlug = slugify(base);
        if (topicRepository.existsBySubjectIdAndSlug(subjectId, cleanSlug)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Такой slug темы уже есть в этом предмете");
        }
        int ord = topicRepository.findBySubjectIdOrderBySortOrderAsc(subjectId).size();
        Topic t = new Topic();
        t.setSubject(subject);
        t.setName(name.trim());
        t.setSlug(cleanSlug);
        t.setSortOrder(ord);
        topicRepository.save(t);
        return new TopicDtos.TopicSummary(
                t.getId(),
                subject.getId(),
                subject.getName(),
                t.getName(),
                t.getSlug(),
                t.getSortOrder(),
                0
        );
    }

    @Transactional
    public TopicDtos.SubtopicSummary createSubtopic(Long topicId, String name) {
        Topic topic = topicRepository.findById(topicId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        Subject subject = topic.getSubject();
        int ord = subtopicRepository.findByTopicIdOrderBySortOrderAsc(topicId).size();
        Subtopic s = new Subtopic();
        s.setTopic(topic);
        s.setName(name.trim());
        s.setSortOrder(ord);
        subtopicRepository.save(s);
        return new TopicDtos.SubtopicSummary(
                s.getId(),
                subject.getId(),
                subject.getName(),
                topic.getId(),
                topic.getName(),
                s.getName(),
                s.getSortOrder(),
                0
        );
    }

    private static String slugify(String raw) {
        String base = raw.trim().toLowerCase()
                .replaceAll("\\s+", "-")
                .replaceAll("[^a-z0-9а-яё-]", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
        if (base.isEmpty()) {
            return "item-" + System.currentTimeMillis();
        }
        return base;
    }
}
