const defaultFile = {
  name: 'file1',
  base64EncodedText: '',
  normalText: '',
};

const normalTextTextArea = document.getElementById('normalText');
const base64EncodedTextTextArea = document.getElementById('base64EncodedText');
const fileNameTabList = document.getElementById('fileNameTabs');
const activeFileTab = document.getElementById('activeFileTab');
const newFileNameInput = document.getElementById('newFileNameInput');
const createNewFileModal = bootstrap.Modal.getOrCreateInstance(
  document.querySelector('#createNewFileModal')
);

const body = document.getElementById('body');

let files = [];

// helpers
const loadFilesFromStorage = () => {
  return JSON.parse(localStorage.getItem('files')) ?? [];
};

const loadThemePreferenceFromStorage = () => {
  return localStorage.getItem('themePreference') ?? 'theme-dark';
};

const setThemePreferenceToStorage = (themeClassName) => {
  return localStorage.setItem('themePreference', themeClassName);
};

const storeFilesToStorage = (files) => {
  localStorage.setItem('files', JSON.stringify(files));
};

const saveFile = (fileName) => {
  const index = files.findIndex((el) => el.name === fileName);
  if (index === -1) {
    console.warn('File Not Found !');
    return;
  }

  files[index] = {
    name: fileName,
    base64EncodedText: base64EncodedTextTextArea.value,
    normalText: normalTextTextArea.value,
  };

  storeFilesToStorage(files);
};

const deleteFile = (fileName) => {
  const index = files.findIndex((el) => el.name === fileName);
  if (index === -1) {
    console.warn('File Not Found !');
    return;
  }

  if (confirm(`Remove file '${fileName}' ? `)) {
    files.splice(index, 1);
    storeFilesToStorage(files);
    renderEnvironment(files);
  }
};

// conversion functions
const convertToBase64EncodedString = () => {
  const normalText = normalTextTextArea.value;
  if (!normalText) {
  }
  base64EncodedTextTextArea.value = btoa(normalText);
};

const convertToNormalString = () => {
  const base64EncodedText = base64EncodedTextTextArea.value;
  if (!base64EncodedText) {
  }
  normalTextTextArea.value = atob(base64EncodedText);
};

const throwError = (errorMessage) => {
  console.error(errorMessage);
  alert(errorMessage);
};

const addNewFile = () => {
  const fileName = newFileNameInput.value;
  if (!fileName) {
    throwError('New File name is required');
    return;
  }

  if (files.findIndex((file) => file.name === fileName) !== -1) {
    throwError('File Name must be unique');
    return;
  }

  const newFile = {
    ...defaultFile,
    name: fileName,
  };
  files.push(newFile);
  storeFilesToStorage(files);

  // reset input and close create new file modal
  newFileNameInput.value = '';
  createNewFileModal.hide();

  renderEnvironment(files, fileName);
};

const setActiveFile = (fileName) => {
  renderEnvironment(files, fileName);
};

const clearAllData = () => {
  if (confirm('All the data will be cleared. Confirm.')) {
    localStorage.removeItem('files');
    initializeEnvironment();
  }
};

const resetEnvironment = () => {
  base64EncodedTextTextArea.value = '';
  normalTextTextArea.value = '';
  fileNameTabList.innerHTML = '';
};

const renderEnvironment = (files, activeFileName = null) => {
  console.log('renderEnvironment');

  // render file names
  resetEnvironment();

  for (const [index, file] of files.entries()) {
    const li = document.createElement('li');
    li.className = 'px-2 py-0 d-flex align-items-center';
    li.style.cursor = 'pointer';

    li.innerHTML = `<small class="me-auto">${file.name}</small>`;

    li.onclick = () => {
      setActiveFile(file.name);
    };

    // if activeFileName is set, check for file name
    // else set first file as active
    if (activeFileName && file.name == activeFileName) {
      li.classList.add('isActive');

      const btn = document.createElement('button');
      btn.innerHTML = `<i class="fa-solid fa-xs fa-floppy-disk"></i>`;
      btn.className = 'btn btn-sm btn-text';

      btn.onclick = () => {
        saveFile(file.name);
      };

      li.appendChild(btn);

      // also set active files respective texts in textareas
      base64EncodedTextTextArea.value = file.base64EncodedText;
      normalTextTextArea.value = file.normalText;
    }

    const btn = document.createElement('button');
    btn.innerHTML = `<i class="fa-solid fa-xs fa-trash"></i>`;
    btn.className = 'btn btn-sm btn-text';

    btn.onclick = (e) => {
      e.stopPropagation();
      deleteFile(file.name);
    };

    li.appendChild(btn);

    fileNameTabList.appendChild(li);
  }

  if (activeFileName) {
    // set active file tab
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
  renderEnvironment(files);
};

initializeEnvironment();

// resize logics
const resize = document.querySelector('#resize');
const left = document.querySelector('.left');
const container = document.querySelector('.container-fluid');
let moveX =
  left.getBoundingClientRect().width + resize.getBoundingClientRect().width / 2;

let drag = false;

resize.addEventListener('mousedown', function (e) {
  drag = true;
  moveX = e.x;
});

container.addEventListener('mousemove', function (e) {
  moveX = e.x;
  if (drag)
    left.style.width = moveX - resize.getBoundingClientRect().width / 2 + 'px';
});

container.addEventListener('mouseup', function (e) {
  drag = false;
});

// themes
const setDarkTheme = () => {
  setThemePreferenceToStorage('theme-dark');
  body.classList.remove('theme-light');
  body.classList.add('theme-dark');
};

const setLightTheme = () => {
  setThemePreferenceToStorage('theme-light');
  body.classList.remove('theme-dark');
  body.classList.add('theme-light');
};

const copyToClipboard = (type) => {
  if (type === 'normal') {
    normalTextTextArea.select();
    normalTextTextArea.setSelectionRange(0, 99999); // For mobile devices
    navigator.clipboard.writeText(normalTextTextArea.value);

    text = normalTextTextArea.value;
  } else if (type === 'base64') {
    base64EncodedTextTextArea.select();
    base64EncodedTextTextArea.setSelectionRange(0, 99999); // For mobile devices
    navigator.clipboard.writeText(base64EncodedTextTextArea.value);

    text = base64EncodedTextTextArea.value;
  }
};
