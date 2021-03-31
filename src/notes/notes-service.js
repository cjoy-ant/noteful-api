const NotesService = {
  getAllFolders(knex) {
    return knex.select("*").from("noteful_notes");
  },

  getById(knex, id) {
    return knex.from("noteful_notes").select("*").where("id", id).first();
  },

  deleteFolder(knex, id) {
    return knex("noteful_notes").where({ id }).delete();
  },

  updateFolder(knex, id, newFolderFields) {
    return knex("blogful_articles").where({ id }).update(newFolderFields);
  },

  insertFolder(knex, newFolder) {
    return knex
      .insert(newFolder)
      .into("noteful_notes")
      .returning("*")
      .then((rows) => {
        return rows[0];
      });
  },
};

module.exports = NotesService;
