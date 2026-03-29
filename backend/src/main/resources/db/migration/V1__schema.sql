CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(120) NOT NULL,
    role VARCHAR(32) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE topics (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    sort_order INTEGER NOT NULL
);

CREATE TABLE subtopics (
    id BIGSERIAL PRIMARY KEY,
    topic_id BIGINT NOT NULL REFERENCES topics (id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sort_order INTEGER NOT NULL
);

CREATE TABLE tasks (
    id BIGSERIAL PRIMARY KEY,
    subtopic_id BIGINT NOT NULL REFERENCES subtopics (id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    type VARCHAR(32) NOT NULL,
    correct_option_index INTEGER,
    correct_answers_json TEXT,
    explanation TEXT
);

CREATE TABLE task_options (
    id BIGSERIAL PRIMARY KEY,
    task_id BIGINT NOT NULL REFERENCES tasks (id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    option_text TEXT NOT NULL
);

CREATE INDEX idx_subtopics_topic_id ON subtopics (topic_id);
CREATE INDEX idx_tasks_subtopic_id ON tasks (subtopic_id);
CREATE INDEX idx_task_options_task_id ON task_options (task_id);
