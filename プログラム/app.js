const MANIFEST_PATH = "./picture-manifest.json";
const imageSelector = document.getElementById("image-selector");
const analyzeButton = document.getElementById("analyze-button");
const selectedImage = document.getElementById("selected-image");
const analysisResult = document.getElementById("analysis-result");
const metaPath = document.getElementById("meta-path");
const metaSize = document.getElementById("meta-size");
const metaBytes = document.getElementById("meta-bytes");

const interactionSurface = document.getElementById("interaction-surface");
const textPopup = document.getElementById("text-popup");
const popupInput = document.getElementById("popup-input");
const popupApply = document.getElementById("popup-apply");
const popupCancel = document.getElementById("popup-cancel");
const popupTargetTextbox = document.getElementById("popup-target-textbox");

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
  lastAction: "なし",
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

const getSelectedImageConfig = () => {
  const imageId = imageSelector.value;
  return appState.images.find((item) => item.id === imageId) || null;
};

const selectBlockById = (blockId) => {
  const targetBlock = document.querySelector(`.block[data-block-id="${blockId}"]`);
  if (!targetBlock) {
    return false;
  }
  document.querySelectorAll(".block").forEach((node) => node.classList.remove("selected"));
  targetBlock.classList.add("selected");
  appState.selectedBlock = blockId;
  return true;
};

const focusTextboxById = (textboxId) => {
  const textbox = document.querySelector(`.textbox[data-textbox-id="${textboxId}"]`);
  if (!textbox) {
    return false;
  }
  document.querySelectorAll(".textbox").forEach((node) => node.classList.remove("active"));
  textbox.classList.add("active");
  appState.activeTextboxId = textboxId;
  appState.currentScreen = "テキスト編集画面";
  if (textPopup) {
    textPopup.classList.remove("hidden");
  }
  if (popupTargetTextbox) {
    popupTargetTextbox.textContent = textboxId;
  }
  if (popupInput) {
    popupInput.value = textbox.textContent;
    popupInput.focus();
    popupInput.select();
  }
  setStateView();
  return true;
};

const executeImageAction = (action, selected, clickInfo) => {
  if (!action || typeof action !== "object") {
    return;
  }

  switch (action.type) {
    case "navigate":
      if (action.nextScreen) {
        appState.currentScreen = action.nextScreen;
        appState.lastAction = `画面遷移: ${action.nextScreen}`;
      }
      break;
    case "select-block":
      if (action.blockId && selectBlockById(action.blockId)) {
        appState.currentScreen = "ブロック選択画面";
        appState.lastAction = `ブロック選択: ${action.blockId}`;
      }
      break;
    case "focus-textbox":
      if (action.textboxId && focusTextboxById(action.textboxId)) {
        appState.currentScreen = "テキスト編集画面";
        appState.lastAction = `textbox編集: ${action.textboxId}`;
      }
      break;
    case "notify":
    default:
      appState.lastAction = action.message || `${selected.name} をクリック`;
      break;
  }

  analysisResult.textContent = JSON.stringify(
    {
      type: action.type || "notify",
      image: selected.name,
      imageId: selected.id,
      click: clickInfo,
      detail: action.message || null,
      lastAction: appState.lastAction,
    },
    null,
    2
  );
  setStateView();
};

const resolveImageAction = (selected, clickInfo) => {
  const hotspots = Array.isArray(selected.hotspots) ? selected.hotspots : [];
  const hotspotAction = hotspots.find((hotspot) => {
    if (!hotspot || typeof hotspot !== "object" || !hotspot.onClick) {
      return false;
    }

    const unit = hotspot.unit === "ratio" ? "ratio" : "pixel";
    const x = Number(hotspot.x);
    const y = Number(hotspot.y);
    const w = Number(hotspot.w);
    const h = Number(hotspot.h);
    if (![x, y, w, h].every(Number.isFinite)) {
      return false;
    }

    if (unit === "ratio") {
      return (
        clickInfo.ratioX >= x &&
        clickInfo.ratioX <= x + w &&
        clickInfo.ratioY >= y &&
        clickInfo.ratioY <= y + h
      );
    }

    return (
      clickInfo.pixelX >= x &&
      clickInfo.pixelX <= x + w &&
      clickInfo.pixelY >= y &&
      clickInfo.pixelY <= y + h
    );
  });

  if (hotspotAction) {
    return hotspotAction.onClick;
  }

  if (selected.onClick && typeof selected.onClick === "object") {
    return selected.onClick;
  }

  return {
    type: "notify",
    message: `${selected.name} をクリックしました`,
  };
};

const closeTextPopup = () => {
  if (textPopup) {
    textPopup.classList.add("hidden");
  }
};

const applyTextboxValue = () => {
  if (!appState.activeTextboxId) {
    return;
  }
  const textbox = document.querySelector(
    `.textbox[data-textbox-id="${appState.activeTextboxId}"]`
  );
  if (!textbox || !popupInput) {
    return;
  }
  textbox.textContent = popupInput.value;
  closeTextPopup();
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
      focusTextboxById(textbox.dataset.textboxId);
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

  if (popupApply) {
    popupApply.addEventListener("click", applyTextboxValue);
  }

  if (popupCancel) {
    popupCancel.addEventListener("click", closeTextPopup);
  }

  if (popupInput) {
    popupInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        applyTextboxValue();
      }
      if (event.key === "Escape") {
        closeTextPopup();
      }
    });
  }

  if (textPopup) {
    textPopup.addEventListener("click", (event) => {
      if (event.target === textPopup) {
        closeTextPopup();
      }
    });
  }

  selectedImage.addEventListener("click", (event) => {
    const selected = getSelectedImageConfig();
    if (!selected) {
      return;
    }

    const rect = selectedImage.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return;
    }

    const localX = event.clientX - rect.left;
    const localY = event.clientY - rect.top;
    const imageWidth = selectedImage.naturalWidth || rect.width;
    const imageHeight = selectedImage.naturalHeight || rect.height;
    const pixelX = Math.round((localX / rect.width) * imageWidth);
    const pixelY = Math.round((localY / rect.height) * imageHeight);

    const clickInfo = {
      pixelX,
      pixelY,
      ratioX: Number((localX / rect.width).toFixed(4)),
      ratioY: Number((localY / rect.height).toFixed(4)),
    };

    const action = resolveImageAction(selected, clickInfo);
    executeImageAction(action, selected, clickInfo);
  });
};

const analyzeSelectedImage = async () => {
  const selected = getSelectedImageConfig();
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
  const selected = getSelectedImageConfig();
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
