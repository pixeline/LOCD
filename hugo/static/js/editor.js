//convert text to base64 file
function toBase64(text) {
  return new Promise((file) => {
    const reader = new FileReader();
    reader.addEventListener("load", (ev) =>
      file(reader.result.slice(reader.result.indexOf(",") + 1))
    );
    reader.readAsDataURL(new Blob([text]));
  });
}

//Checks if the file is a JS or CSS file.
async function createDataFile(textAr, element, type, file) {
  let text = document.getElementById(textAr).value;
  if (text) {
    let docEl = document.createElement(element);
    docEl.type = type;

    if (element === "link") {
      const content = `data:text/css;base64,${await toBase64(text)}`;
      docEl.rel = file;
      docEl.href = await content;
    } else {
      const content = `data:text/javascript;base64,${await toBase64(text)}`;
      docEl.src = await content;
      docEl.defer = true;
    }
    return docEl;
  }
  return;
}

//insert base64 files inside the html content before the head closing tag.
function insertFiles(content, ...elements) {
  let lines = content.replace(/\r\n/g, "\n").split("\n");
  elements.map((element) => {
    if (element) {
      const head = (element) => element === "</head>";
      let index = lines.findIndex(head);
      lines.splice(index, 0, element.outerHTML);
    }
  });
  let array = lines.join("\n");
  return array;
}

//save editors and pushes the datafiles in the head. We call here the writeIFrame function to display the text.
function viewContent() {
  if (HTMLeditor) {
    HTMLeditor.save();
    CSSeditor.save();
    JSeditor.save();
  }

  let text = document.getElementById("textareaCodeHTML").value;

  Promise.all([
    createDataFile("textareaCodeCSS", "link", "text/css", "stylesheet"),
    createDataFile("textareaCodeJS", "script", "text/javascript"),
  ]).then((values) => {
    text = insertFiles(text, values[0], values[1]);
    writeIFrame(text);
  });
}

function writeIFrame(html) {
  let ifr = document.createElement("iframe");
  ifr.setAttribute("frameborder", "0");
  ifr.setAttribute("id", "iframeResult");
  ifr.setAttribute("name", "iframeResult");
  ifr.setAttribute("allowfullscreen", "true");
  document.getElementById("iframewrapper").innerHTML = "";
  document.getElementById("iframewrapper").appendChild(ifr);

  let ifrw = ifr.contentWindow
    ? ifr.contentWindow
    : ifr.contentDocument.document
    ? ifr.contentDocument.document
    : ifr.contentDocument;

  ifrw.document.open();
  ifrw.document.write(html);
  ifrw.document.close();
  console.log("saved...");
}

//Update Iframe when user is done typing
let userType = () => {
  let typingTimer;
  const doneTypingCount = 1500;

  document.addEventListener("keyup", () => {
    clearTimeout(typingTimer);
    typingTimer = setTimeout(noTyping, doneTypingCount);
  });

  function noTyping() {
    console.clear();
    viewContent();
  }
};

function loadEditor() {
  let htmlContent = localStorage.getItem(`${fetchTitle()}-html`);
  let cssContent = localStorage.getItem(`${fetchTitle()}-css`);
  let jsContent = localStorage.getItem(`${fetchTitle()}-js`);
  console.log(htmlContent);
  if (htmlContent) {
    HTMLeditor.setValue(htmlContent);
    CSSeditor.setValue(cssContent);
    JSeditor.setValue(jsContent);
  }
}

let saveButton = document.getElementById("saveButton");
saveButton.addEventListener("click", saveEditor);

function saveEditor() {
  viewContent();
  let htmlContent = HTMLeditor.getValue();
  let cssContent = CSSeditor.getValue();
  let jsContent = JSeditor.getValue();
  messagePop("Succesfully saved!");
  localStorage.setItem(`${fetchTitle()}-html`, htmlContent);
  localStorage.setItem(`${fetchTitle()}-css`, cssContent);
  localStorage.setItem(`${fetchTitle()}-js`, jsContent);
}

let resetButton = document.getElementById("resetButton");
resetButton.addEventListener("click", resetEditor);

function resetEditor() {
  let resetModal = document.querySelector(".reset");
  let confirmButtons = resetModal.querySelector(".reset__selection");
  let acceptButton = confirmButtons.firstElementChild;
  let declineButton = confirmButtons.lastElementChild;

  resetModal.style = "display:block";

  acceptButton.addEventListener("click", () => {
    console.log("clicked!");
    let htmlView = document.getElementById("textareaCodeHTML");
    messagePop("Succesfully reset!");

    HTMLeditor.setValue(fetchHTMLFile());
    CSSeditor.setValue(fetchCSSFile());
    JSeditor.setValue("");

    CSSeditor.refresh();

    localStorage.removeItem(`${fetchTitle()}-html`);
    localStorage.removeItem(`${fetchTitle()}-css`);
    localStorage.removeItem(`${fetchTitle()}-js`);
    viewContent();
    resetModal.style = "display:none";
  });

  declineButton.addEventListener("click", () => {
    resetModal.style = "display:none";
  });

  resetModal.addEventListener("click", () => {
    if (!resetModal.firstElementChild.contains(event.target)) {
      resetModal.style = "display:none";
    }
  });
}

function messagePop(text) {
  let message = document.querySelector(".successMessage");
  message.firstElementChild.innerHTML = text;
  message.classList.add("activeMessage");

  message.addEventListener("animationend", () => {
    message.classList.remove("activeMessage");
  });
}

let htmlStartContent = document.getElementById("textareaCodeHTML").value;
let cssStartContent = document.getElementById("textareaCodeCSS").value;
let jsStartContent = document.getElementById("textareaCodeJS").value;

let startContent = [htmlStartContent, cssStartContent, jsStartContent];

const confirmExit = (e) => {
  viewContent();
  let storedHTML = localStorage.getItem(`${fetchTitle()}-html`);
  let storedCSS = localStorage.getItem(`${fetchTitle()}-css`);
  let storedJS = localStorage.getItem(`${fetchTitle()}-css`);

  console.log(HTMLeditor.getValue());

  let textHTML = HTMLeditor.getValue();
  let textCSS = CSSeditor.getValue();
  let textJS = JSeditor.getValue();

  let textStored = [storedHTML, storedCSS, storedJS];
  let textArea = [textHTML, textCSS, textJS];

  for (i = 0; i < textArea.length; i++) {
    if (textStored[i] !== textArea[i] && startContent[i] !== textArea[i]) {
      return "";
    }
  }
};

window.onbeforeunload = confirmExit;

let inputButtons = Array.from(document.getElementById("inputTab").children);

inputButtons.forEach((element) => {
  if (element.tagName === "DIV") {
    element.addEventListener("click", () => {
      let parent = element.parentElement;
      let views = [...document.querySelector(".input__container").children];
      console.log(parent);

      let currentActive = parent.querySelector(".tab--selected");
      currentActive.classList.remove("tab--selected");
      element.classList.add("tab--selected");

      views.forEach((view) => {
        if (view.className !== element.dataset.link) {
          view.style.zIndex = "0";
        } else {
          view.style.zIndex = "1";
        }
      });
    });
  }
});

loadEditor();

//execute at start to view the page
viewContent();
userType();
