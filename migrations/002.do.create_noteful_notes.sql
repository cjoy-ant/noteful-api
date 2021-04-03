CREATE TABLE noteful_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v1mc(),
  note_name TEXT NOT NULL,
  date_modified TIMESTAMPTZ DEFAULT now() NOT NULL,
  folder_id UUID
    REFERENCES noteful_folders(id) ON DELETE CASCADE NOT NULL,
  note_content TEXT NOT NULL
);