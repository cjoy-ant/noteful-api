CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TABLE noteful_folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v1mc(),
  folder_name TEXT NOT NULL
);