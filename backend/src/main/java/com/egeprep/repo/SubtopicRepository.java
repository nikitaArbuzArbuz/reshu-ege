package com.egeprep.repo;

import com.egeprep.model.Subtopic;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SubtopicRepository extends JpaRepository<Subtopic, Long> {
    List<Subtopic> findByTopicIdOrderBySortOrderAsc(Long topicId);
}
