function makeFoldersArray() {
  return [
    {
      id: "52a5d0ce-949b-11eb-a8b3-0242ac130003",
      folder_name: "test folder 1",
    },
    {
      id: "5bb12880-949b-11eb-a8b3-0242ac130003",
      folder_name: "test folder 2",
    },
    {
      id: "5f98dace-949b-11eb-a8b3-0242ac130003",
      folder_name: "test folder 3",
    },
  ];
}

function makeNotesArray() {
  return [
    {
      id: "637c8e24-949b-11eb-a8b3-0242ac130003",
      note_name: "test note 1",
      date_modified: "2019-01-03T00:00:00.000Z",
      folder_id: "52a5d0ce-949b-11eb-a8b3-0242ac130003",
      note_content: "test note 1 content",
    },
    {
      id: "67a2902a-949b-11eb-a8b3-0242ac130003",
      note_name: "test note 2",
      date_modified: "2018-08-15T23:00:00.000Z",
      folder_id: "5bb12880-949b-11eb-a8b3-0242ac130003",
      note_content: "test note 2 content",
    },
    {
      id: "6aa90286-949b-11eb-a8b3-0242ac130003",
      note_name: "test note 3",
      date_modified: "2018-03-01T00:00:00.000Z",
      folder_id: "5f98dace-949b-11eb-a8b3-0242ac130003",
      note_content: "test note 3 content",
    },
  ];
}

function makeMaliciousFolder() {
  const maliciousFolder = {
    id: "39d297c0-949c-11eb-a8b3-0242ac130003",
    folder_name: 'Naughty naughty very naughty <script>alert("xss");</script>',
  };

  const expectedFolder = {
    ...maliciousFolder,
    folder_name:
      'Naughty naughty very naughty &lt;script&gt;alert("xss");&lt;/script&gt;',
  };
  return { maliciousFolder, expectedFolder };
}

function makeMaliciousNote() {
  const maliciousNote = {
    id: "40250054-949c-11eb-a8b3-0242ac130003",
    note_name: 'Naughty naughty very naughty <script>alert("xss");</script>',
    date_modified: new Date().toISOString(),
    folder_id: "52a5d0ce-949b-11eb-a8b3-0242ac130003", // test folder 1
    note_content: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
  };

  const expectedNote = {
    ...maliciousNote,
    note_name:
      'Naughty naughty very naughty &lt;script&gt;alert("xss");&lt;/script&gt;',
    note_content: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`,
  };

  return { maliciousNote, expectedNote };
}

module.exports = {
  makeFoldersArray,
  makeNotesArray,
  makeMaliciousFolder,
  makeMaliciousNote,
};
