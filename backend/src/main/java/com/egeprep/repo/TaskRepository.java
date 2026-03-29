package com.egeprep.repo;

import com.egeprep.model.Task;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TaskRepository extends JpaRepository<Task, Long> {
    @EntityGraph(attributePaths = {"options", "subtopic", "subtopic.topic", "subtopic.topic.subject"})
    List<Task> findBySubtopicIdOrderByIdAsc(Long subtopicId);

    long countBySubtopicId(Long subtopicId);

    @EntityGraph(attributePaths = {"options", "subtopic", "subtopic.topic", "subtopic.topic.subject"})
    @Query("SELECT t FROM Task t WHERE t.subtopic.id IN :subtopicIds")
    List<Task> findBySubtopicIdIn(@Param("subtopicIds") List<Long> subtopicIds);

    @EntityGraph(attributePaths = {"options", "subtopic", "subtopic.topic", "subtopic.topic.subject"})
    @Override
    Optional<Task> findById(Long id);
}
