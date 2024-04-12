const defaultFile = {
  name: "untitled",
  base64EncodedText: "",
  normalText: "",
};

const lang = {
  FILE_SAVED_SUCCESSFULLY: (fileName) =>
    `Contents saved to ${fileName} successfully`,
  COPIED_TO_CLIPBOARD: (type) => `${type} text copied to clipboard`,
  FIELD_REQUIRED: (fieldName) => `${fieldName} is required`,
  FIELD_UNIQUE: (fieldName) => `${fieldName} must be unique`,
  FIELD_NOT_FOUND: (fieldName) => `${fieldName} not found`,
  CONFIRM_REMOVE: (fileName) => `Remove file '${fileName}' ? `,
  CONFIRM_CLEAR_ALL: "All the data will be cleared. Confirm.",
};

const normalTextTextArea = document.getElementById("normalText");
const base64EncodedTextTextArea = document.getElementById("base64EncodedText");
const fileNameTabList = document.getElementById("fileNameTabs");
const activeFileTab = document.getElementById("activeFileTab");
const newFileNameInput = document.getElementById("newFileNameInput");
const renameFileNameInput = document.getElementById("renameFileNameInput");
const createNewFileModal = bootstrap.Modal.getOrCreateInstance(
  document.querySelector("#createNewFileModal")
);
const editFileModal = new bootstrap.Modal(
  document.getElementById("renameNewFileModal")
);
const body = document.getElementById("body");
const toastSection = document.getElementById("toastSection");

// theme
const loadThemePreferenceFromStorage = () => {
  return localStorage.getItem("themePreference") ?? "theme-dark";
};

const setThemePreferenceToStorage = (themeClassName) => {
  return localStorage.setItem("themePreference", themeClassName);
};

const setDarkTheme = () => {
  setThemePreferenceToStorage("theme-dark");
  body.classList.remove("theme-light");
  body.classList.add("theme-dark");
};

const setLightTheme = () => {
  setThemePreferenceToStorage("theme-light");
  body.classList.remove("theme-dark");
  body.classList.add("theme-light");
};

// state
let files = [];

const loadFilesFromStorage = () => {
  return JSON.parse(localStorage.getItem("files"))?.length
    ? JSON.parse(localStorage.getItem("files"))
    : [{ ...defaultFile }];
};

const storeFilesToStorage = (files) => {
  localStorage.setItem("files", JSON.stringify(files));
};

const addNewFile = () => {
  const fileName = newFileNameInput.value;
  if (!fileName) {
    throwError(lang.FIELD_REQUIRED("File name"));
    return;
  }

  if (files.findIndex((file) => file.name === fileName) !== -1) {
    throwError(lang.FIELD_UNIQUE("File name"));
    return;
  }

  const newFile = {
    ...defaultFile,
    name: fileName,
  };

  files.push(newFile);
  storeFilesToStorage(files);

  // reset input and close create new file modal
  newFileNameInput.value = "";
  createNewFileModal.hide();

  renderEnvironment(files, fileName);
};

const renameFile = () => {
  const newFileName = renameFileNameInput.value;
  const oldFileName = renameFileNameInput.dataset.oldfilename;
  if (newFileName === oldFileName) {
    editFileModal.hide();
    return;
  }

  const index = files.findIndex((el) => el.name === oldFileName);
  if (index === -1) {
    console.warn(lang.FIELD_NOT_FOUND("File"));
    return;
  }

  if (files.findIndex((file) => file.name === newFileName) !== -1) {
    throwError(lang.FIELD_UNIQUE("File name"));
    return;
  }

  files[index].name = newFileName;
  storeFilesToStorage(files);

  // reset input and close create new file modal
  renameFileNameInput.setAttribute("data-oldfilename", "");
  renameFileNameInput.value = "";

  editFileModal.hide();

  renderEnvironment(files, newFileName);
};

const setActiveFile = (fileName) => {
  activeFileTab.setAttribute("data-activefile", fileName || "");
  renderEnvironment(files, fileName);
};

const saveFile = (fileName) => {
  const index = files.findIndex((el) => el.name === fileName);
  if (index === -1) {
    console.warn(lang.FIELD_NOT_FOUND("File"));
    return;
  }

  files[index] = {
    name: fileName,
    base64EncodedText: base64EncodedTextTextArea.value,
    normalText: normalTextTextArea.value,
  };

  storeFilesToStorage(files);
  showToast(lang.FILE_SAVED_SUCCESSFULLY(fileName));
};

const deleteFile = (fileName) => {
  const index = files.findIndex((el) => el.name === fileName);
  if (index === -1) {
    console.warn(lang.FIELD_NOT_FOUND("File"));
    return;
  }

  if (confirm(lang.CONFIRM_REMOVE(fileName))) {
    files.splice(index, 1);
    storeFilesToStorage(files);
    files = loadFilesFromStorage();
    renderEnvironment(files, files?.[0]?.name);
  }
};

const clearAllData = () => {
  if (confirm(lang.CONFIRM_CLEAR_ALL)) {
    localStorage.removeItem("files");
    initializeEnvironment();
  }
};

// conversion functions
const convertToBase64EncodedString = () => {
  const normalText = normalTextTextArea.value;
  if (!normalText) return;
  base64EncodedTextTextArea.value = btoa(normalText);
  // save to file after conversion
  const activeFile = activeFileTab.dataset.activefile;
  if (activeFile) {
    saveFile(activeFile);
  }
};

const convertToNormalString = () => {
  const base64EncodedText = base64EncodedTextTextArea.value;
  if (!base64EncodedText) return;
  normalTextTextArea.value = atob(base64EncodedText);
  // save to file after conversion
  const activeFile = activeFileTab.dataset.activefile;
  if (activeFile) {
    saveFile(activeFile);
  }
};

const throwError = (errorMessage) => {
  console.error(errorMessage);
  alert(errorMessage);
};

const resetEnvironment = () => {
  base64EncodedTextTextArea.value = "";
  normalTextTextArea.value = "";
  fileNameTabList.innerHTML = "";
};

const renderEnvironment = (files, activeFileName = null) => {
  resetEnvironment();

  for (const [index, file] of files.entries()) {
    const li = document.createElement("li");
    li.className = "px-2 py-0 d-flex align-items-center";
    li.style.cursor = "pointer";

    li.innerHTML = `<small class="me-auto text-truncate">${file.name}</small>`;

    li.onclick = () => {
      setActiveFile(file.name);
    };

    // if activeFileName is set, check for file name
    if (activeFileName && file.name == activeFileName) {
      li.classList.add("isActive");

      // edit btn
      const editBtn = document.createElement("button");
      editBtn.innerHTML = `<i class="fa-solid fa-xs fa-pencil"></i>`;
      editBtn.className = "btn btn-sm btn-text";
      editBtn.title = "Rename File";
      editBtn.onclick = (e) => {
        e.stopPropagation();
        renameFileNameInput.setAttribute("data-oldfilename", file.name);
        renameFileNameInput.value = file.name;
        editFileModal.show();
      };

      li.appendChild(editBtn);

      const btn = document.createElement("button");
      btn.innerHTML = `<i class="fa-solid fa-xs fa-floppy-disk"></i>`;
      btn.className = "btn btn-sm btn-text";
      btn.title = "Save File";

      btn.onclick = () => {
        saveFile(file.name);
      };

      li.appendChild(btn);

      // also set active files respective texts in textareas
      base64EncodedTextTextArea.value = file.base64EncodedText;
      normalTextTextArea.value = file.normalText;
    }

    const btn = document.createElement("button");
    btn.innerHTML = `<i class="fa-solid fa-xs fa-trash"></i>`;
    btn.className = "btn btn-sm btn-text";
    btn.title = "Delete File";

    btn.onclick = (e) => {
      e.stopPropagation();
      deleteFile(file.name);
    };

    li.appendChild(btn);

    fileNameTabList.appendChild(li);
  }

  if (activeFileName) {
    // set active file tab
    activeFileTab.setAttribute("data-activefile", activeFileName);
    activeFileTab.innerHTML = `
    <small>${activeFileName}</small>
    <button class="btn btn-small btn-text" onclick="setActiveFile(null)">
      <i class="fa-solid fa-xmark"></i>
    </button>
    `;
  } else {
    activeFileTab.innerHTML = ``;
  }
};

// initialization
const initializeEnvironment = () => {
  body.classList.add(loadThemePreferenceFromStorage());
  files = loadFilesFromStorage();
  renderEnvironment(files, files?.[0]?.name);
};

initializeEnvironment();

// resize explorer area
const resize = document.querySelector("#resize");
const left = document.querySelector(".left");
const container = document.querySelector(".container-fluid");
let moveX =
  left.getBoundingClientRect().width + resize.getBoundingClientRect().width / 2;

let drag = false;

resize.addEventListener("mousedown", function (e) {
  drag = true;
  moveX = e.x;
});

container.addEventListener("mousemove", function (e) {
  moveX = e.x;
  if (drag)
    left.style.width = moveX - resize.getBoundingClientRect().width / 2 + "px";
});

container.addEventListener("mouseup", function (e) {
  drag = false;
});

const copyToClipboard = (type) => {
  if (type === "normal") {
    normalTextTextArea.select();
    normalTextTextArea.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(normalTextTextArea.value);

    text = normalTextTextArea.value;
  } else if (type === "base64") {
    base64EncodedTextTextArea.select();
    base64EncodedTextTextArea.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(base64EncodedTextTextArea.value);

    text = base64EncodedTextTextArea.value;
  }

  showToast(lang.COPIED_TO_CLIPBOARD(type));
};

const showToast = (message, delay = 500, bgColor = "success") => {
  if (!message) return;

  const toastDiv = document.createElement("div");
  toastDiv.className = "toast";
  toastDiv.role = "alert";
  toastDiv.innerHTML = `
    <div class="toast-body d-flex justify-content-between align-items-center bg-${bgColor}">
      ${message}
    </div>
  `;
  toastSection.appendChild(toastDiv);

  const boostrapToast = new bootstrap.Toast(toastDiv, { delay: 500 });
  boostrapToast.show();
};
