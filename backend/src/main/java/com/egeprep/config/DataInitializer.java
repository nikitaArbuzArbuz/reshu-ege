package com.egeprep.config;

import com.egeprep.model.*;
import com.egeprep.repo.SubjectRepository;
import com.egeprep.repo.TopicRepository;
import com.egeprep.repo.UserRepository;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @Bean
    ApplicationRunner seed(
            UserRepository userRepository,
            SubjectRepository subjectRepository,
            TopicRepository topicRepository,
            PasswordEncoder passwordEncoder
    ) {
        return args -> {
            if (userRepository.count() == 0) {
                User admin = new User();
                admin.setEmail("admin@ege.local");
                admin.setPasswordHash(passwordEncoder.encode("admin123"));
                admin.setDisplayName("Администратор");
                admin.setRole(Role.ADMIN);
                userRepository.save(admin);
            }

            if (topicRepository.count() > 0) {
                return;
            }

            Subject subject = new Subject();
            subject.setName("Математика");
            subject.setSlug("math");
            subject.setSortOrder(0);
            subjectRepository.save(subject);

            Topic math = new Topic();
            math.setSubject(subject);
            math.setName("Профиль");
            math.setSlug("profile");
            math.setSortOrder(0);

            Subtopic st1 = new Subtopic();
            st1.setTopic(math);
            st1.setName("Производная и экстремумы");
            st1.setSortOrder(0);
            math.getSubtopics().add(st1);

            Subtopic st2 = new Subtopic();
            st2.setTopic(math);
            st2.setName("Интегралы");
            st2.setSortOrder(1);
            math.getSubtopics().add(st2);

            Task mc = new Task();
            mc.setSubtopic(st1);
            mc.setType(TaskType.MULTIPLE_CHOICE);
            mc.setQuestionText("Найдите производную функции f(x) = x^3 при x = 1.");
            mc.setCorrectOptionIndex(2);
            mc.setExplanation("Производная 3x^2, при x=1 получается 3.");
            st1.getTasks().add(mc);

            for (int i = 0; i < 4; i++) {
                TaskOption o = new TaskOption();
                o.setTask(mc);
                o.setOrderIndex(i);
                o.setOptionText(switch (i) {
                    case 0 -> "1";
                    case 1 -> "2";
                    case 2 -> "3";
                    default -> "4";
                });
                mc.getOptions().add(o);
            }

            Task tx = new Task();
            tx.setSubtopic(st1);
            tx.setType(TaskType.TEXT);
            tx.setQuestionText("Сколько будет 7 + 5? (ответ — число)");
            tx.setCorrectAnswersJson("[\"12\"]");
            tx.setExplanation("7 + 5 = 12");
            st1.getTasks().add(tx);

            topicRepository.save(math);
        };
    }
}
