const { expect } = require("chai");
const knex = require("knex");
const supertest = require("supertest");
const app = require("../src/app");
const { makeFoldersArray, makeMaliciousFolder } = require("./fixtures");

describe.only("/folders Endpoints", function () {
  let db;

  before("make knex instance", () => {
    db = knex({
      client: "pg",
      connection: process.env.TEST_DB_URL,
    });
    app.set("db", db);
  });

  after("disconnect from db", () => db.destroy());

  //before("clean the table", () => db("noteful_folders").truncate());
  before("clean the table", () =>
    db.raw("TRUNCATE noteful_folders, noteful_notes RESTART IDENTITY CASCADE")
  );

  //afterEach("cleanup", () => db("noteful_folders").truncate());
  afterEach("cleanup", () =>
    db.raw("TRUNCATE noteful_folders, noteful_notes RESTART IDENTITY CASCADE")
  );

  describe(`GET /api/folders`, () => {
    context(`Given no folders`, () => {
      it(`responds with 200 and an empty list`, () => {
        return supertest(app).get("/api/folders").expect(200, []);
      });
    });

    context("Given there are folders in the database", () => {
      const testFolders = makeFoldersArray();

      beforeEach("insert folders", () => {
        return db.into("noteful_folders").insert(testFolders);
      });

      it("GET /api/folders responds with 200 and all of the folders", () => {
        return supertest(app).get("/api/folders").expect(200, testFolders);
      });
    });

    context("Given an XSS attack folder", () => {
      const testFolders = makeFoldersArray();
      const { maliciousFolder, expectedFolder } = makeMaliciousFolder();

      beforeEach("insert malicious folder", () => {
        return db
          .into("noteful_folders")
          .insert(testFolders)
          .then(() => {
            return db.into("noteful_folders").insert([maliciousFolder]);
          });
      });

      it("removes XSS attack content", () => {
        return supertest(app)
          .get("/api/folders")
          .expect(200)
          .expect((res) => {
            expect(res.body[res.body.length - 1].folder_name).to.eql(
              expectedFolder.folder_name
            );
          });
      });
    });
  });
});
