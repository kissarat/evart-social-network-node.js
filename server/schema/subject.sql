CREATE TYPE deactivated AS ENUM ('deleted', 'banned');

CREATE TABLE subject (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  deactivated deactivated,
  hidden BOOLEAN NOT NULL DEFAULT FALSE,
  photo_id BIGSERIAL,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  city INT,
  country INT,
  home_town VARCHAR(64),
  domain VARCHAR(32),
  site VARCHAR(64),
  status VARCHAR(140),
  wall_comments BOOLEAN NOT NULL DEFAULT TRUE,
  can_post BOOLEAN NOT NULL DEFAULT TRUE,
  can_see_all_posts BOOLEAN NOT NULL DEFAULT TRUE,
  can_see_audio BOOLEAN NOT NULL DEFAULT TRUE,
  can_write_private_message BOOLEAN NOT NULL DEFAULT TRUE,
  can_send_friend_request BOOLEAN NOT NULL DEFAULT TRUE,
  timezone SMALLINT,
  about TEXT
);

CREATE TABLE "user" (
  first_name VARCHAR(32) NOT NULL,
  last_name VARCHAR(32) NOT NULL,
  nickname VARCHAR(32),
  maiden_name VARCHAR(32),
  relation INT,
  sex SMALLINT NOT NULL DEFAULT 0,
  activities TEXT,
  interests TEXT,
  music TEXT,
  movies TEXT,
  tv TEXT,
  books TEXT,
  games TEXT,
  quotes TEXT
) INHERITS (subject);

CREATE TYPE group_type AS ENUM ('group', 'page', 'event');

CREATE TABLE "group" (
  is_closed SMALLINT NOT NULL DEFAULT 0,
  type group_type NOT NULL DEFAULT 'group'
) INHERITS (subject);
