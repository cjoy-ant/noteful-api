const path = require("path");
const express = require("express");
const xss = require("xss");
const NotesService = require("./notes-service");

const notesRouter = express.Router();
const jsonParser = express.json();

const serializeNote = (note) => ({
  id: note.id,
  note_name: xss(note.note_name),
  date_modified: note.date_modified,
  folder_id: note.folder_id,
  note_content: xss(note.note_content),
});
