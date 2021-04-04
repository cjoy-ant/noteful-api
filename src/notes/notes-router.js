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

notesRouter
  .route("/")
  .get((req, res, next) => {
    const knex = req.app.get("db");
    NotesService.getAllNotes(knex)
      .then((notes) => {
        res.json(notes.map(serializeNote));
      })
      .catch(next);
  })
  .post(jsonParser, (req, res, next) => {
    const { note_name, folder_id, note_cdontent } = req.body;
    const newNote = { note_name, folder_id, note_cdontent };
    const knex = req.app.get("db");

    for (const [key, value] of Object.entries(newNote)) {
      if (value == null) {
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body` },
        });
      }
    }

    NotesService.insertNote(knex, newNote).then((note) => {
      res
        .status(201)
        .location(path.posix.join(req.originalUrl, `/${note.id}`))
        .json(serializeFolder(note));
    });
  });

notesRouter
  .route("/:note_id")
  .all((req, res, next) => {
    const knexInstance = req.app.get("db");
    NotesService.getById(knexInstance, req.params.note_id)
      .then((note) => {
        if (!note) {
          return res.status(404).json({
            error: { message: `Note not found` },
          });
        }
        res.note = note;
        next();
      })
      .catch(next);
  })
  .get((req, res, next) => {
    res.json({
      id: res.note.id,
      note_name: xss(res.note.note_name),
      date_modified: res.note.date_modified,
      folder_id: res.note.folder_id,
      note_content: xss(res.note.note_content),
    });
  })
  .delete((req, res, next) => {
    const knexInstance = req.app.get("db");
    NotesService.deleteNote(knexInstance, req.params.note_id)
      .then(() => {
        res.status(204).end();
      })
      .catch(next);
  })
  .patch(jsonParser, (req, res, next) => {
    const { note_name, folder_id, note_cdontent } = req.body;
    const noteToUpdate = { note_name, folder_id, note_cdontent };

    const numberOfValues = Object.values(noteToupdate).filter(Boolean).length;
    if (numberOfValues === 0) {
      return res.status(400).json({
        error: {
          message: `Request body must contain the following: 'note_name', 'folder_id', and 'note_content'`,
        },
      });
    }

    const knexInstance = req.app.get("db");
    NotesService.updateNote(knexInstance, req.params.note_id, noteToUpdate)
      .then((numRowsAffectd) => {
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = notesRouter;
