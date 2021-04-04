const path = require("path");
const express = require("express");
const xss = require("xss");
const FoldersService = require("./folders-service");

const foldersRouter = express.Router();
const jsonParser = express.json();

const serializeFolder = (folder) => ({
  id: folder.id,
  folder_name: xss(folder.folder_name),
});

foldersRouter
  .route("/")
  .get((req, res, next) => {
    const knex = req.app.get("db");
    FoldersService.getAllFolders(knex)
      .then((folders) => {
        res.json(folders.map(serializeFolder));
      })
      .catch(next);
  })
  .post(jsonParser, (req, res, next) => {
    const { folder_name } = req.body;
    const newFolder = { folder_name };
    const knex = req.app.get("db");

    for (const [key, value] of Object.entries(newFolder)) {
      if (value == null) {
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body` },
        });
      }
    }

    FoldersService.insertFolder(knex, newFolder).then((folder) => {
      res
        .status(201)
        .location(path.posix.join(req.originalUrl, `/${folder.id}`))
        .json(serializeFolder(folder));
    });
  });

foldersRouter
  .route("/:folder_id")
  .all((req, res, next) => {
    const knexInstance = req.app.get("db");
    FoldersService.getById(knexInstance, req.params.folder_id)
      .then((folder) => {
        if (!folder) {
          return res.status(404).json({
            error: { message: `Folder not found` },
          });
        }
        res.folder = folder;
        next();
      })
      .catch(next);
  })
  .get((req, res, next) => {
    res.json({
      id: res.folder.id,
      folder_name: xss(res.folder.folder_name),
    });
  })
  .delete((req, res, next) => {
    const knexInstance = req.app.get("db");
    FoldersService.deleteFolder(knexInstance, req.params.folder_id)
      .then(() => {
        res.status(204).end();
      })
      .catch(next);
  })
  .patch(jsonParser, (req, res, next) => {
    const { folder_name } = req.body;
    const folderToUpdate = { folder_name };

    const numberOfValues = Object.values(folderToUpdate).filter(Boolean).length;
    if (numberOfValues === 0) {
      return res.status(400).json({
        error: {
          message: `Request body must contain 'folder_name'`,
        },
      });
    }

    const knexInstance = req.app.get("db");
    FoldersService.updateFolder(
      knexInstance,
      req.params.folder_id,
      folderToUpdate
    )
      .then((numRowsAffectd) => {
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = foldersRouter;
