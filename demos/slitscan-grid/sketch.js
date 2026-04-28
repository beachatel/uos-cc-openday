// Ordered list of available still images to expose in the grid UI.
const ASSET_NAMES = {
  wallala:
    "https://res.cloudinary.com/dry9agskc/image/upload/v1777367270/wallala_opvxfa.jpg",
  botticelli:
    "https://res.cloudinary.com/dry9agskc/image/upload/v1777367269/botticelli_qtkeul.png",
  jamesWebb1:
    "https://res.cloudinary.com/dry9agskc/image/upload/v1777367270/james-webb_gtezsa.jpg",
  jamesWebb2:
    "https://res.cloudinary.com/dry9agskc/image/upload/v1777367270/james-webb2_llbeio.jpg",
  yinka:
    "https://res.cloudinary.com/dry9agskc/image/upload/v1777367270/yinka_yzpq2q.jpg",
  penfold:
    "https://res.cloudinary.com/dry9agskc/image/upload/v1777367271/penfold_oxrijs.png",
  fonts:
    "https://res.cloudinary.com/dry9agskc/image/upload/v1777367270/fonts1_j0ngol.png",
  logo: "https://res.cloudinary.com/dry9agskc/image/upload/v1777367269/logo-banner_updr0v.png",
};
let logoImg;

let grid;
let cameraCapture;
let fullscreenButton;
const stillImages = {};
let activeBuffer = null;
let isFullscreen = false;

function preload() {
  Object.entries(ASSET_NAMES).forEach(([key, url]) => {
    stillImages[key] = loadImage(url);
  });

  logoImg = stillImages.logo;
}

// Initialize canvas, media sources, and the grid controller UI.
function setup() {
  const defaultImageName = "wallala";
  const defaultImage = stillImages[defaultImageName];

  createCanvas(defaultImage.width, defaultImage.height);
  activeBuffer = defaultImage;

  cameraCapture = createCapture(VIDEO, { flipped: true });
  cameraCapture.elt.setAttribute("playsinline", "");
  cameraCapture.hide();

  cameraCapture.elt.onloadedmetadata = () => {
    cameraCapture.size(
      cameraCapture.elt.videoWidth * 2,
      cameraCapture.elt.videoHeight * 2,
    );
    cameraCapture.hide();

    if (grid && grid.getSourceType() === "camera") {
      updateBuffer(cameraCapture);
    }
  };

  grid = new Grid(40, 40, defaultImage, {
    assets: Object.keys(ASSET_NAMES),
    defaultSource: "image",
    defaultImage: defaultImageName,
    onSourceChange: handleSourceChange,
    onImageChange: handleImageChange,
  });

  grid.createGrid();
  grid.setBuffer(defaultImage);

  fullscreenButton = createButton("Enter Fullscreen");
  fullscreenButton.parent(grid.container);
  fullscreenButton.mousePressed(toggleFullscreen);

  handleSourceChange(grid.getSourceType());
}
// Draw the evolving grid by sampling noise-driven regions from the active buffer.
function draw() {
  background(255);
  noStroke();
  grid.noiseGrid();
  grid.tiles.forEach((tile) => {
    tile.show();
  });
  // fill(255, 255);
  // rect(0, height - height / 4, width / 4, height / 4, 2);
  // image(logoImg, 0, height - height / 4, width / 4, height / 4);
  // console.log(stillImages);
}

// React to source changes from the UI, selecting camera or still images.
function handleSourceChange(source) {
  if (source === "camera") {
    waitForMedia(cameraCapture, () => updateBuffer(cameraCapture));
    return;
  }
  handleImageChange(grid.getSelectedImageName());
}

// Swap the underlying buffer when the user picks a different still image.
function handleImageChange(imageName) {
  if (!imageName || grid.getSourceType() !== "image") return;

  const selectedImage = stillImages[imageName];
  if (!selectedImage) return;

  if (selectedImage.width && selectedImage.height) {
    updateBuffer(selectedImage);
  } else {
    waitForMedia(selectedImage, () => updateBuffer(selectedImage));
  }
}

// Update the render buffer and resize the canvas to the new dimensions.
function updateBuffer(buffer) {
  if (!buffer || !buffer.width || !buffer.height) {
    return;
  }
  activeBuffer = buffer;
  if (!isFullscreen) {
    resizeCanvas(buffer.width, buffer.height);
  }
  grid.setBuffer(buffer);
  grid.createGrid();
}

// Toggle fullscreen mode and resize the canvas/grid accordingly.
function toggleFullscreen() {
  const shouldBeFullscreen = !fullscreen();
  fullscreen(shouldBeFullscreen);
  isFullscreen = shouldBeFullscreen;
  if (fullscreenButton) {
    fullscreenButton.html(
      shouldBeFullscreen ? "Exit Fullscreen" : "Enter Fullscreen",
    );
  }
  if (!grid) {
    return;
  }
  if (shouldBeFullscreen) {
    resizeCanvas(windowWidth, windowHeight);
    grid.createGrid();
    return;
  }
  if (activeBuffer) {
    resizeCanvas(activeBuffer.width, activeBuffer.height);
    grid.createGrid();
  }
}

// React to browser window changes while fullscreen to keep canvas fitted.
function windowResized() {
  if (!isFullscreen) {
    return;
  }
  if (!grid) {
    return;
  }
  resizeCanvas(windowWidth, windowHeight);
  grid.createGrid();
}
// Ensure media assets report valid dimensions before invoking the callback.
function waitForMedia(media, callback) {
  if (!media) {
    return;
  }
  if (media.width && media.height) {
    callback();
    return;
  }
  setTimeout(() => waitForMedia(media, callback), 50);
}
