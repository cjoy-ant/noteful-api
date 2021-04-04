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

      beforeEach("insert test folders", () => {
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

  describe(`GET /api/folders/:folder_id`, () => {
    context(`Given no folders`, () => {
      it(`responds with 404`, () => {
        const folderId = "146d4c3e-94cc-11eb-a8b3-0242ac130003";
        return supertest(app)
          .get(`/api/folders/${folderId}`)
          .expect(404, { error: { message: `Folder not found` } });
      });
    });

    context(`Given there are folders in the database`, () => {
      const testFolders = makeFoldersArray();

      beforeEach("insert test folders", () => {
        return db.into("noteful_folders").insert(testFolders);
      });

      it(`responds with 200 and the specified folder`, () => {
        const folderId = "5bb12880-949b-11eb-a8b3-0242ac130003";
        const expectedFolder = testFolders[1];

        return supertest(app)
          .get(`/api/folders/${folderId}`)
          .expect(200, expectedFolder);
      });
    });

    context(`Given an XSS attack folder`, () => {
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

      it(`removes xss attack content`, () => {
        return supertest(app)
          .get(`/api/folders/${maliciousFolder.id}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.folder_name).to.eql(expectedFolder.folder_name);
          });
      });
    });
  });

  describe(`POST /api/folders/`, () => {
    const testFolders = makeFoldersArray();

    beforeEach("insert test folders", () => {
      return db.into("noteful_folders").insert(testFolders);
    });

    it(`creates a folder, responding with 201 and the new folder`, () => {
      const newFolder = {
        folder_name: "test new folder",
      };

      return supertest(app)
        .post("/api/folders")
        .send(newFolder)
        .expect(201)
        .expect((res) => {
          expect(res.body.folder_name).to.eql(newFolder.folder_name);
          expect(res.body).to.have.property("id");
          expect(res.headers.location).to.eql(`/api/folders/${res.body.id}`);
        })
        .then((postRes) =>
          supertest(app)
            .get(`/api/folders/${postRes.body.id}`)
            .expect(postRes.body)
        );
    });
  });
});
