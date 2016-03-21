CREATE TABLE dir (
  id BIGSERIAL PRIMARY KEY,
  owner_id BIGINT NOT NULL,
  title TEXT NOT NULL,
  cover_id BIGINT
);

CREATE TABLE file (
  id BIGSERIAL PRIMARY KEY,
  dir_id BIGINT,
  data TEXT
);
