const MANIFEST_PATH = "./picture-manifest.json";
const imageSelector = document.getElementById("image-selector");
const analyzeButton = document.getElementById("analyze-button");
const selectedImage = document.getElementById("selected-image");
const analysisResult = document.getElementById("analysis-result");
const metaPath = document.getElementById("meta-path");
const metaSize = document.getElementById("meta-size");
const metaBytes = document.getElementById("meta-bytes");

const interactionSurface = document.getElementById("interaction-surface");
const bottomInput = document.getElementById("bottom-input");
const applyText = document.getElementById("apply-text");

const stateScreen = document.getElementById("state-screen");
const stateCursor = document.getElementById("state-cursor");
const stateHover = document.getElementById("state-hover");
const stateBlock = document.getElementById("state-block");
const stateTextbox = document.getElementById("state-textbox");

const appState = {
  currentScreen: "メイン画面",
  selectedBlock: null,
  activeTextboxId: null,
  images: [],
};

const imageWorker = new Worker("./image-worker.js");
imageWorker.addEventListener("message", (event) => {
  const { type, payload } = event.data || {};
  if (type !== "analysis-result") {
    return;
  }
  analysisResult.textContent = JSON.stringify(payload, null, 2);
});

const setStateView = () => {
  stateScreen.textContent = appState.currentScreen;
  stateBlock.textContent = appState.selectedBlock || "なし";
  stateTextbox.textContent = appState.activeTextboxId || "なし";
};

const applyTextboxValue = () => {
  if (!appState.activeTextboxId) {
    return;
  }
  const textbox = document.querySelector(
    `.textbox[data-textbox-id="${appState.activeTextboxId}"]`
  );
  if (!textbox) {
    return;
  }
  textbox.textContent = bottomInput.value;
};

const bindInteractions = () => {
  interactionSurface.addEventListener("pointermove", (event) => {
    const rect = interactionSurface.getBoundingClientRect();
    const x = Math.round(event.clientX - rect.left);
    const y = Math.round(event.clientY - rect.top);
    stateCursor.textContent = `x: ${x}, y: ${y}`;

    const element = document.elementFromPoint(event.clientX, event.clientY);
    const hoverText =
      element?.dataset?.textboxId ||
      element?.dataset?.blockId ||
      element?.className ||
      element?.tagName ||
      "-";
    stateHover.textContent = hoverText;
  });

  document.querySelectorAll(".textbox").forEach((textbox) => {
    textbox.addEventListener("click", () => {
      document
        .querySelectorAll(".textbox")
        .forEach((node) => node.classList.remove("active"));
      textbox.classList.add("active");
      appState.activeTextboxId = textbox.dataset.textboxId;
      appState.currentScreen = "テキスト編集画面";
      bottomInput.value = textbox.textContent;
      bottomInput.focus();
      setStateView();
    });
  });

  document.querySelectorAll(".block").forEach((block) => {
    block.addEventListener("click", () => {
      document
        .querySelectorAll(".block")
        .forEach((node) => node.classList.remove("selected"));
      block.classList.add("selected");
      appState.selectedBlock = block.dataset.blockId;
      appState.currentScreen = "ブロック選択画面";
      setStateView();
    });
  });

  applyText.addEventListener("click", applyTextboxValue);
  bottomInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      applyTextboxValue();
    }
  });
};

const analyzeSelectedImage = async () => {
  const imageId = imageSelector.value;
  const selected = appState.images.find((item) => item.id === imageId);
  if (!selected) {
    return;
  }

  analysisResult.textContent = "解析中...";

  const img = new Image();
  img.decoding = "async";
  img.src = selected.path;
  await img.decode();

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const context = canvas.getContext("2d");
  context.drawImage(img, 0, 0);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

  imageWorker.postMessage({
    type: "analyze",
    payload: {
      width: canvas.width,
      height: canvas.height,
      pixels: imageData.data,
    },
  });
};

const updateImageView = async () => {
  const imageId = imageSelector.value;
  const selected = appState.images.find((item) => item.id === imageId);
  if (!selected) {
    return;
  }

  selectedImage.src = selected.path;
  metaPath.textContent = selected.path;
  metaBytes.textContent = selected.sizeBytes
    ? `${selected.sizeBytes.toLocaleString()} bytes`
    : "-";

  await selectedImage.decode();
  metaSize.textContent = `${selectedImage.naturalWidth} x ${selectedImage.naturalHeight}`;
};

const loadManifest = async () => {
  const response = await fetch(MANIFEST_PATH, { cache: "no-cache" });
  if (!response.ok) {
    throw new Error(`Manifest load failed: ${response.status}`);
  }
  const data = await response.json();
  if (!Array.isArray(data.images)) {
    throw new Error("Invalid manifest format.");
  }
  appState.images = data.images;
};

const mountImageSelector = () => {
  imageSelector.innerHTML = "";
  appState.images.forEach((image) => {
    const option = document.createElement("option");
    option.value = image.id;
    option.textContent = image.name;
    imageSelector.appendChild(option);
  });
};

const boot = async () => {
  bindInteractions();
  try {
    await loadManifest();
    mountImageSelector();
    if (appState.images.length > 0) {
      await updateImageView();
    }
  } catch (error) {
    analysisResult.textContent = `初期化エラー: ${error.message}`;
  }

  imageSelector.addEventListener("change", updateImageView);
  analyzeButton.addEventListener("click", analyzeSelectedImage);
  setStateView();
};

boot();
