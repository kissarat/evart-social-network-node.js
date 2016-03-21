CREATE TYPE object_type AS ENUM ('dialog', 'wall', 'photo', 'video', 'file');

CREATE TABLE object (
  id BIGSERIAL PRIMARY KEY,
  owner_id BIGINT NOT NULL,
  type object_type NOT NULL,
  file_id BIGINT,
  title VARCHAR(192)
);


CREATE TABLE "message" (
  id BIGSERIAL PRIMARY KEY,
  time BIGINT PRIMARY KEY,
  body TEXT NOT NULL,
  sender_id BIGINT NOT NULL,
  receiver_id BIGINT,
  chat_id BIGINT,
  "read" BOOLEAN
);


CREATE TABLE peer (
  object_id BIGINT NOT NULL,
  subject_id BIGINT NOT NULL
);


CREATE TABLE "read" (
  subject_id BIGINT NOT NULL,
  time BIGINT NOT NULL
);


CREATE TABLE message_view AS
  SELECT m.id, m.type, m.time, m.body, m.chat_id, m.receiver_id, m.parent_id,
    m.sender_id, s.name FROM message m
  JOIN subject s ON m.sender_id = s.id WHERE NOT is_comment;

CREATE VIEW message_list AS
  SELECT mm.id, "type", sender_id, receiver_id, body, time, "name",
    (SELECT count(*) FROM message rm WHERE "read" = FALSE AND rm.sender_id = mv.sender_id AND rm.receiver_id = mv.receiver_id) as unread FROM
  (SELECT max(m.id) as id FROM "message" m WHERE chat_id IS NULL GROUP BY sender_id, receiver_id, type) mm
  JOIN message_view mv ON mm.id = mv.id;

CREATE VIEW chat_list AS
  SELECT mm.id, sender_id, receiver_id, body, time, "name" FROM
  (SELECT max(m.id) as id FROM "message" m WHERE chat_id IS NOT NULL GROUP BY chat_id) mm
  JOIN message_view mv ON mm.id = mv.id;