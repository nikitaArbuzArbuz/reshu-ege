CREATE TABLE subjects (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    sort_order INTEGER NOT NULL
);

INSERT INTO subjects (id, name, slug, sort_order) VALUES (1, 'Математика', 'math', 0);

ALTER TABLE topics DROP CONSTRAINT IF EXISTS topics_slug_key;

ALTER TABLE topics ADD COLUMN subject_id BIGINT REFERENCES subjects (id);

UPDATE topics SET subject_id = 1 WHERE subject_id IS NULL;

ALTER TABLE topics ALTER COLUMN subject_id SET NOT NULL;

ALTER TABLE topics ADD CONSTRAINT uk_topics_subject_slug UNIQUE (subject_id, slug);

CREATE INDEX idx_topics_subject_id ON topics (subject_id);
