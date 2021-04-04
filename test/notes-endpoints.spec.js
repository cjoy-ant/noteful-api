const { expect } = require("chai");
const knex = require("knex");
const supertest = require("supertest");
const app = require("../src/app");
const {
  makeNotesArray,
  makeMaliciousNote,
  makeFoldersArray,
} = require("./fixtures");

describe("/notes Endpoints", function () {
  let db;

  before("make knex instance", () => {
    db = knex({
      client: "pg",
      connection: process.env.TEST_DB_URL,
    });
    app.set("db", db);
  });

  after("disconnect from db", () => db.destroy());

  //before("clean the table", () => db("noteful_notes").truncate());
  before("clean the table", () =>
    db.raw("TRUNCATE noteful_notes, noteful_folders RESTART IDENTITY CASCADE")
  );

  //afterEach("cleanup", () => db("noteful_notes").truncate());
  afterEach("cleanup", () =>
    db.raw("TRUNCATE noteful_notes, noteful_folders RESTART IDENTITY CASCADE")
  );

  describe(`GET /api/notes`, () => {
    context(`Given no notes`, () => {
      it(`responds with 200 and an empty list`, () => {
        return supertest(app).get("/api/notes").expect(200, []);
      });
    });

    context("Given there are notes in the database", () => {
      const testFolders = makeFoldersArray();
      const testNotes = makeNotesArray();

      beforeEach("insert test notes", () => {
        return db
          .into("noteful_folders")
          .insert(testFolders)
          .then(() => {
            return db.into("noteful_notes").insert(testNotes);
          });
      });

      it("GET /api/notes responds with 200 and all of the notes", () => {
        return supertest(app).get("/api/notes").expect(200, testNotes);
      });
    });

    context("Given an XSS attack note", () => {
      const testFolders = makeFoldersArray();
      const { maliciousNote, expectedNote } = makeMaliciousNote();

      beforeEach("insert malicious note", () => {
        return db
          .into("noteful_folders")
          .insert(testFolders)
          .then(() => {
            return db.into("noteful_notes").insert([maliciousNote]);
          });
      });

      it("removes XSS attack content", () => {
        return supertest(app)
          .get("/api/notes")
          .expect(200)
          .expect((res) => {
            expect(res.body[res.body.length - 1].note_name).to.eql(
              expectedNote.note_name
            );
            expect(res.body[res.body.length - 1].note_content).to.eql(
              expectedNote.note_content
            );
          });
      });
    });
  });

  describe(`GET /api/notes/:note_id`, () => {
    context(`Given no notes`, () => {
      it(`responds with 404`, () => {
        const noteId = "7f7f6206-94e4-11eb-a8b3-0242ac130003"; // non-existent noteId
        return supertest(app)
          .get(`/api/notes/${noteId}`)
          .expect(404, { error: { message: `Note not found` } });
      });
    });

    context(`Given there are notes in the database`, () => {
      const testFolders = makeFoldersArray();
      const testNotes = makeNotesArray();

      beforeEach("insert test notes", () => {
        return db
          .into("noteful_folders")
          .insert(testFolders)
          .then(() => {
            return db.into("noteful_notes").insert(testNotes);
          });
      });

      it(`responds with 200 and the specified note`, () => {
        const noteId = "67a2902a-949b-11eb-a8b3-0242ac130003"; // test note 2
        const expectedNote = testNotes[1];

        return supertest(app)
          .get(`/api/notes/${noteId}`)
          .expect(200, expectedNote);
      });
    });

    context(`Given an XSS attack content`, () => {
      const testFolders = makeFoldersArray();
      const { maliciousNote, expectedNote } = makeMaliciousNote();

      beforeEach("insert malicious note", () => {
        return db
          .into("noteful_folders")
          .insert(testFolders)
          .then(() => {
            return db.into("noteful_notes").insert([maliciousNote]);
          });
      });

      it(`removes xss attack content`, () => {
        return supertest(app)
          .get(`/api/notes/${maliciousNote.id}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.note_name).to.eql(expectedNote.note_name);
            expect(res.body.note_content).to.eql(expectedNote.note_content);
          });
      });
    });
  });

  describe.only(`POST /api/notes/`, () => {
    const testFolders = makeFoldersArray();
    const testNotes = makeNotesArray();

    beforeEach("insert test notes", () => {
      return db
        .into("noteful_folders")
        .insert(testFolders)
        .then(() => {
          return db.into("noteful_notes").insert(testNotes);
        });
    });

    it(`creates a note, responding with 201 and the new note`, () => {
      const newNote = {
        note_name: "test new note name",
        folder_id: "52a5d0ce-949b-11eb-a8b3-0242ac130003", //test folder 1
        note_content: "test new note content",
      };

      return supertest(app)
        .post("/api/notes")
        .send(newNote)
        .expect(201)
        .expect((res) => {
          expect(res.body.note_name).to.eql(newNote.note_name);
          expect(res.body.folder_id).to.eql(newNote.folder_id);
          expect(res.body.note_content).to.eql(newNote.note_content);
          expect(res.body).to.have.property("id");
          expect(res.headers.location).to.eql(`/api/notes/${res.body.id}`);
          const expected = new Date().toLocaleDateString();
          const actual = new Date(res.body.date_modified).toLocaleDateString();
          expect(actual).to.eql(expected);
        })
        .then((postRes) =>
          supertest(app)
            .get(`/api/notes/${postRes.body.id}`)
            .expect(postRes.body)
        );
    });

    // validation testing
    const requiredFields = ["note_name", "folder_id", "note_content"];

    requiredFields.forEach((field) => {
      const newNote = {
        note_name: "test new note name",
        folder_id: "52a5d0ce-949b-11eb-a8b3-0242ac130003", //test folder 1
        note_content: "test new note content",
      };

      it(`responds with 400 and an error message when the '${field}' is missing`, () => {
        delete newNote[field];

        return supertest(app)
          .post("/api/notes")
          .send(newNote)
          .expect(400, {
            error: { message: `Missing '${field}' in request body` },
          });
      });
    });

    it(`removes xss attack content from response`, () => {
      const { maliciousNote, expectedNote } = makeMaliciousNote();
      return supertest(app)
        .post(`/api/notes`)
        .send(maliciousNote)
        .expect(201)
        .expect((res) => {
          expect(res.body.note_name).to.eql(expectedNote.note_name);
          expect(res.body.note_content).to.eql(expectedNote.note_content);
        });
    });
  });

  describe(`DELETE /api/notes/:note_id`, () => {
    context(`Given no notes`, () => {
      it(`responds with 404`, () => {
        const noteId = "7f7f6206-94e4-11eb-a8b3-0242ac130003"; // non-existent note
        return supertest(app)
          .delete(`/api/notes/${noteId}`)
          .expect(404, { error: { message: `Note not found` } });
      });
    });

    context(`Given there are notes in the database`, () => {
      const testNotes = makeNotesArray();

      beforeEach("insert test notes", () => {
        return db.into("noteful_notes").insert(testNotes);
      });

      it(`responds with 204 and removes the note`, () => {
        const idToRemove = "67a2902a-949b-11eb-a8b3-0242ac130003"; // test note 2
        const expectedNotes = testNotes.filter(
          (note) => note.id !== idToRemove
        );

        return supertest(app)
          .delete(`/api/notes/${idToRemove}`)
          .expect(204)
          .then((res) =>
            supertest(app).get(`/api/notes`).expect(expectedNotes)
          );
      });
    });
  });

  describe(`PATCH /api/notes/:note_id`, () => {
    context(`Given no notes`, () => {
      it(`responds with 404`, () => {
        const noteId = "7f7f6206-94e4-11eb-a8b3-0242ac130003";
        return supertest(app)
          .patch(`/api/notes/${noteId}`)
          .expect(404, { error: { message: `Note not found` } });
      });
    });
    context(`Given there are notes in the database`, () => {
      const testNotes = makeNotesArray();

      beforeEach("insert test notes", () => {
        return db.into("noteful_notes").insert(testNotes);
      });

      it(`responds with 204 and updates the note`, () => {
        const idToUpdate = "67a2902a-949b-11eb-a8b3-0242ac130003"; // test note 2
        const updateNote = {
          note_name: "updated note name",
          folder_id: "5bb12880-949b-11eb-a8b3-0242ac130003", // test folder 2
          note_content: "updated note content",
        };

        const expectedNote = {
          ...testNotes[1],
          ...updateNote,
        };

        return supertest(app)
          .patch(`/api/notes/${idToUpdate}`)
          .send(updateNote)
          .expect(204)
          .then((res) =>
            supertest(app).get(`/api/notes/${idToUpdate}`).expect(expectedNote)
          );
      });
    });
  });
});
