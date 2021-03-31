CREATE EXTENSION pgcrypto;
CREATE TABLE noteful_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_name TEXT NOT NULL
);