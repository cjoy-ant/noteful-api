CREATE TABLE noteful_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_name TEXT NOT NULL,
  date_modified TIMESTAMPTZ DEFAULT now() NOT NULL,
  folder_id UUID,
  note_content TEXT NOT NULL
);