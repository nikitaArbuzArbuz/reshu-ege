package com.egeprep.repo;

import com.egeprep.model.Topic;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TopicRepository extends JpaRepository<Topic, Long> {
    List<Topic> findBySubjectIdOrderBySortOrderAsc(Long subjectId);

    Optional<Topic> findBySubjectIdAndSlug(Long subjectId, String slug);

    boolean existsBySubjectIdAndSlug(Long subjectId, String slug);
}
