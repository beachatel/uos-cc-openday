/*
 * SPRITE TRAIL ANIMATION
 * Interactive sprite simulation with customizable parameters
 *
 * Features:
 * - Grid-based sprite movement with collision detection
 * - Fading trail effects
 * - Real-time parameter control via sliders
 * - Constraint area for focused simulation
 */

// =============================================================================
// SIMULATION PARAMETERS
// =============================================================================

// Grid System
let cellSize = 20; // Size of each grid cell in pixels
let occupancyGrid = []; // 2D array tracking cell occupancy

// Constraint Area (rectangular boundary for sprites)
let constraintAreaSize = 400; // Width and height of constraint area
let constraintAreaX = 0; // X position of constraint area
let constraintAreaY = 0; // Y position of constraint area
let targetGridCellCount = 20; // Target number of grid cells across constraint area

// Sprite Properties
let sprites = []; // Array of all sprite objects
let spriteCount = 20; // Number of active sprites
let trailSegments = 25; // Max number of trail segments per sprite (intuitive length)
let fadeSpeed = 10; // Alpha decrease per update (higher = faster fade)

// Animation Control
let updateInterval = 100; // Milliseconds between sprite updates
let spriteUpdateInterval; // Timer ID for sprite updates

// Visual Theme
let colorPalette = []; // Array of colors for sprites

// =============================================================================
// USER INTERFACE
// =============================================================================

// Slider Controls (actual sliders used in the UI)
let cellSizeSlider,
  constraintSizeSlider,
  fadeSpeedSlider,
  trailSegmentsSlider,
  spriteCountSlider,
  updateIntervalSlider;

// Slider Labels (for real-time value display)
let cellSizeLabel,
  constraintSizeLabel,
  fadeSpeedLabel,
  trailSegmentsLabel,
  spriteCountLabel,
  updateIntervalLabel;

// UI Container Elements
let controlPanel; // Container for all sliders
let toggleControlsButton; // Button to show/hide controls
let controlsVisible = true; // Current visibility state of controls

// =============================================================================
// MAIN PROGRAM FUNCTIONS
// =============================================================================

// =============================================================================
// INITIALIZATION FUNCTIONS
// =============================================================================

/**
 * Get valid grid sizes that divide evenly into both width and height
 * @returns {Array} Array of valid grid sizes
 */
function getValidGridSizes() {
  let validSizes = [];

  // Find all divisors of width and height
  for (let size = 4; size <= 80; size++) {
    if (width % size === 0 && height % size === 0) {
      validSizes.push(size);
    }
  }

  return validSizes;
}

/**
 * Find the closest valid grid size to a target value
 * @param {number} targetSize - The desired grid size
 * @returns {number} The closest valid grid size
 */
function getClosestValidGridSize(targetSize) {
  let validSizes = getValidGridSizes();
  let closest = validSizes[0];
  let minDiff = Math.abs(targetSize - closest);

  for (let size of validSizes) {
    let diff = Math.abs(targetSize - size);
    if (diff < minDiff) {
      minDiff = diff;
      closest = size;
    }
  }

  return closest;
}

/**
 * Center the constraint area on the canvas
 */
function centerConstraintArea() {
  let centerX = width / 2;
  let centerY = height / 2;
  constraintAreaX =
    Math.floor((centerX - constraintAreaSize / 2) / cellSize) * cellSize;
  constraintAreaY =
    Math.floor((centerY - constraintAreaSize / 2) / cellSize) * cellSize;
}

/**
 * Set up the constraint area in the center of the canvas
 */
function initializeConstraintArea() {
  // Calculate how many grid cells fit in the initial constraint area
  targetGridCellCount = Math.floor(constraintAreaSize / cellSize);

  // Ensure constraint area size aligns with grid
  constraintAreaSize = targetGridCellCount * cellSize;

  // Center the constraint area on canvas, aligned to grid
  let centerX = width / 2;
  let centerY = height / 2;
  constraintAreaX =
    Math.floor((centerX - constraintAreaSize / 2) / cellSize) * cellSize;
  constraintAreaY =
    Math.floor((centerY - constraintAreaSize / 2) / cellSize) * cellSize;
}

/**
 * Define the color palette for sprites
 */
function setupColorPalette() {
  colorPalette = [
    color(0, 0, 0), // Black
    color(240, 240, 240), // Light gray
    color(255, 255, 255), // White
    color(96, 106, 245), // Blue
  ];
}

function setup() {
  createCanvas(600, 600);

  // Calculate initial target grid cells based on starting values
  targetGridCellCount = Math.floor(constraintAreaSize / cellSize);

  // Ensure constraintAreaSize is aligned to cellSize
  constraintAreaSize = targetGridCellCount * cellSize;

  // Center the constraint area on the canvas, snapped to grid
  let centerX = width / 2;
  let centerY = height / 2;
  constraintAreaX =
    Math.floor((centerX - constraintAreaSize / 2) / cellSize) * cellSize;
  constraintAreaY =
    Math.floor((centerY - constraintAreaSize / 2) / cellSize) * cellSize;

  // noStroke();
  createSliders();

  // Set initial step values for sliders
  updateSliderRanges();

  colorPalette = [
    color(0, 0, 0), // black
    // color(80, 80, 80), // dark gray
    // color(240, 240, 240), // light gray
    color(255, 255, 255), // white
    color(96, 106, 245), // blue
  ];

  //initialise grid to track if the current cell is occupied
  initializeOccupancyGrid();

  // create Sprite objects
  createSprites(spriteCount, cellSize, colorPalette, trailSegments);

  // Apply current fade speed to initial sprites
  for (let sprite of sprites) {
    sprite.trailFadeStep = Math.max(1, Number(fadeSpeed));
  }

  // Start the sprite update interval
  startSpriteUpdateInterval();
}

function draw() {
  background(45);

  // Update variables from sliders
  updateVariablesFromSliders();
  // Draw grid first so sprites and trails render on top
  // renderGrid();
  // Then draw sprites and their trails
  for (let sprite of sprites) {
    sprite.checkEdges();
    sprite.show();
  }

  // Draw constraint rectangle last
  drawConstraintArea();
}

/**
 * Initialize the 2D grid that tracks cell occupancy
 * Each cell stores a number representing how many sprites/trails occupy it
 */
function initializeOccupancyGrid() {
  occupancyGrid = [];
  let totalColumns = Math.floor(width / cellSize);
  let totalRows = Math.floor(height / cellSize);

  for (let column = 0; column < totalColumns; column++) {
    occupancyGrid[column] = [];
    for (let row = 0; row < totalRows; row++) {
      occupancyGrid[column][row] = 0; // 0 = empty, >0 = occupied
    }
  }
}

/**
 * Create the specified number of sprites within the constraint area
 * @param {number} count - Number of sprites to create
 * @param {number} size - Size of each sprite (should match cellSize)
 * @param {Array} palette - Array of colors to choose from
 * @param {number} fadeSpeed - How quickly sprite trails fade
 */
function createSprites(count, size, palette, fadeSpeed) {
  sprites = []; // Clear any existing sprites

  for (let i = 0; i < count; i++) {
    // Calculate how many grid cells fit in the constraint area
    let maxColumns = Math.floor(constraintAreaSize / size);
    let maxRows = Math.floor(constraintAreaSize / size);

    // Pick a random cell within the constraint area
    let randomColumn = Math.floor(random(maxColumns));
    let randomRow = Math.floor(random(maxRows));

    // Convert grid coordinates to pixel coordinates
    let spriteX = constraintAreaX + randomColumn * size;
    let spriteY = constraintAreaY + randomRow * size;

    // Pick a random color from the palette
    let spriteColor = palette[Math.floor(random(palette.length))];

    // Create and add the new sprite
    let newSprite = new Sprite(spriteX, spriteY, size, spriteColor, fadeSpeed);
    sprites.push(newSprite);
  }
}

// =============================================================================
// RENDERING FUNCTIONS
// =============================================================================

/**
 * Render all sprites and handle edge wrapping
 */
function renderSprites() {
  for (let sprite of sprites) {
    sprite.checkEdges(); // Handle wrapping at constraint area boundaries
    sprite.show(); // Draw the sprite and its trail
  }
}

/**
 * Render the grid lines within the constraint area
 */
function renderGrid() {
  stroke(60, 80); // Black grid lines
  // noStroke();
  strokeWeight(1); // Thin lines
  fill(40);
  // noFill(); // No fill, just outlines

  // Draw vertical and horizontal grid lines within constraint area only
  for (
    let x = constraintAreaX;
    x < constraintAreaX + constraintAreaSize;
    x += cellSize
  ) {
    for (
      let y = constraintAreaY;
      y < constraintAreaY + constraintAreaSize;
      y += cellSize
    ) {
      rect(x, y, cellSize);
    }
  }
  // Border is drawn separately in drawConstraintArea()
}

/**
 * Render the constraint area boundary
 */
function renderConstraintArea() {
  let borderThickness = 5;

  stroke(0, 255); // Black border with full opacity
  strokeWeight(borderThickness); // Thick border
  noFill(); // No fill, just outline

  // Draw rectangle slightly larger to account for border thickness
  rect(
    constraintAreaX - borderThickness / 2,
    constraintAreaY - borderThickness / 2,
    constraintAreaSize + borderThickness,
    constraintAreaSize + borderThickness
  );
}
let sliderContainer;
let toggleButton;
let slidersVisible = true;
// =============================================================================
// USER INTERFACE CREATION
// =============================================================================

/**
 * Create all UI controls including the toggle button and sliders
 * Sets up a clean interface for adjusting all simulation parameters
 */
function createSliders() {
  // Create the main toggle button for showing/hiding controls
  createToggleButton();

  // Create the container that holds all sliders
  createSliderContainer();

  // Create all individual slider controls
  createAllSliderControls();
}

/**
 * Create the toggle button that shows/hides the control panel
 */
function createToggleButton() {
  toggleButton = createButton("Hide Controls");
  toggleButton.position(10, 10);
  toggleButton.style("background-color", "#333");
  toggleButton.style("color", "white");
  toggleButton.style("border", "1px solid #666");
  toggleButton.style("padding", "5px 10px");
  toggleButton.style("border-radius", "3px");
  toggleButton.style("cursor", "pointer");
  toggleButton.mousePressed(toggleSliders);
}

/**
 * Create the main container that holds all slider controls
 */
function createSliderContainer() {
  sliderContainer = createDiv();
  sliderContainer.position(10, 45); // Position below the toggle button
  sliderContainer.style("position", "absolute");
  sliderContainer.style("color", "white");
  sliderContainer.style("background-color", "rgba(0, 0, 0, 0.7)");
  sliderContainer.style("padding", "10px");
  sliderContainer.style("border-radius", "5px");
  sliderContainer.style("border", "1px solid #666");
}

function createAllSliderControls() {
  // Get valid grid sizes for the slider
  let validGridSizes = getValidGridSizes();
  let minGridSize = Math.min(...validGridSizes);
  let maxGridSize = Math.max(...validGridSizes);

  // Grid cell size slider - affects the resolution of movement (only valid divisors)
  {
    const { slider, label } = createSliderWithLabel(
      "cellSizeSlider",
      "cellSizeLabel",
      minGridSize,
      maxGridSize,
      cellSize,
      "Grid Size: "
    );
    cellSizeSlider = slider;
    cellSizeLabel = label;
  }

  // Constraint area size slider - size of the movement boundary
  {
    const { slider, label } = createSliderWithLabel(
      "constraintSizeSlider",
      "constraintSizeLabel",
      100,
      width / 1.2,
      constraintAreaSize,
      "Area Size: "
    );
    constraintSizeSlider = slider;
    constraintSizeLabel = label;
  }

  // Fade speed slider - how quickly trail segments fade per update (alpha step)
  {
    const { slider, label } = createSliderWithLabel(
      "fadeSpeedSlider",
      "fadeSpeedLabel",
      1,
      64,
      fadeSpeed,
      "Fade Speed: "
    );
    fadeSpeedSlider = slider;
    fadeSpeedLabel = label;
  }

  // Trail segments slider - intuitive trail "length" (max number of segments)
  {
    const { slider, label } = createSliderWithLabel(
      "trailSegmentsSlider",
      "trailSegmentsLabel",
      5,
      100,
      trailSegments,
      "Trail Segments: "
    );
    trailSegmentsSlider = slider;
    trailSegmentsLabel = label;
  }

  // Number of sprites slider - how many sprites are active
  {
    const { slider, label } = createSliderWithLabel(
      "spriteCountSlider",
      "spriteCountLabel",
      1,
      200,
      spriteCount,
      "Num Sprites: "
    );
    spriteCountSlider = slider;
    spriteCountLabel = label;
  }

  // Animation speed slider - interval between sprite updates
  {
    const { slider, label } = createSliderWithLabel(
      "updateIntervalSlider",
      "updateIntervalLabel",
      50,
      500,
      updateInterval,
      "Speed: ",
      1,
      "ms" // Unit suffix
    );
    updateIntervalSlider = slider;
    updateIntervalLabel = label;
  }
}

/**
 * Helper function to create a slider with its associated label
 * @param {string} sliderVarName - Variable name for the slider
 * @param {string} labelVarName - Variable name for the label
 * @param {number} minVal - Minimum slider value
 * @param {number} maxVal - Maximum slider value
 * @param {number} initialVal - Starting value
 * @param {string} labelPrefix - Text to show before the value
 * @param {number} stepSize - Step increment (default 1)
 * @param {string} unitSuffix - Text to show after the value (default empty)
 */
function createSliderWithLabel(
  sliderVarName,
  labelVarName,
  minVal,
  maxVal,
  initialVal,
  labelPrefix,
  stepSize = 1,
  unitSuffix = ""
) {
  // Create the slider element
  let slider = createSlider(minVal, maxVal, initialVal, stepSize);
  slider.style("width", "150px");
  slider.style("margin", "5px 0");

  // Create the label element
  let label = createDiv(labelPrefix + initialVal + unitSuffix);
  label.style("color", "white");
  label.style("font-size", "12px");
  label.style("margin", "2px 0");

  // Add both elements to the container
  sliderContainer.child(label);
  sliderContainer.child(slider);

  // Return created elements to be assigned explicitly by caller
  return { slider, label };
}

// =============================================================================
// PARAMETER UPDATE FUNCTIONS
// =============================================================================

/**
 * Update sprite properties when parameters change
 * Synchronizes all sprites with the current slider values
 */
// (Removed unused legacy updateVariables function)

/**
 * Check if any slider values have changed and update accordingly
 * Handles parameter changes that require system reinitialization
 */
function updateVariablesFromSliders() {
  let needsReset = false;

  // Check if grid parameters changed
  if (cellSize !== cellSizeSlider.value()) {
    // Ensure the grid size is valid (divides evenly into screen dimensions)
    let requestedSize = cellSizeSlider.value();
    let validSize = getClosestValidGridSize(requestedSize);

    // Update the slider to show the valid value
    cellSizeSlider.value(validSize);

    cellSize = validSize;

    // Snap the area size to the new grid size and recenter
    constraintAreaSize = Math.round(constraintAreaSize / cellSize) * cellSize;
    constraintSizeSlider.value(constraintAreaSize);

    // Always center the constraint area when grid size changes
    centerConstraintArea();

    // Recalculate target grid cells
    targetGridCellCount = Math.floor(constraintAreaSize / cellSize);

    needsReset = true;
  }

  if (constraintAreaSize !== constraintSizeSlider.value()) {
    let newSize = constraintSizeSlider.value();

    // Snap the area size to the nearest multiple of gridsize
    constraintAreaSize = Math.round(newSize / cellSize) * cellSize;

    // Update target grid cells based on the snapped gridRange
    targetGridCellCount = Math.floor(constraintAreaSize / cellSize);

    // Always center the constraint area when size changes
    centerConstraintArea();

    // Update the slider to reflect the snapped value
    constraintSizeSlider.value(constraintAreaSize);
    needsReset = true;
  }

  if (spriteCount !== spriteCountSlider.value()) {
    spriteCount = spriteCountSlider.value();
    needsReset = true;
  }

  // Update trail segments (intuitive length) for existing sprites
  if (trailSegments !== trailSegmentsSlider.value()) {
    trailSegments = trailSegmentsSlider.value();
    for (let sprite of sprites) {
      sprite.maxTrailSegments = Math.max(1, Math.floor(trailSegments));
    }
  }

  // Update fade speed for trails (alpha decrease per update)
  if (fadeSpeed !== fadeSpeedSlider.value()) {
    fadeSpeed = fadeSpeedSlider.value();
    for (let sprite of sprites) {
      sprite.trailFadeStep = Math.max(1, Number(fadeSpeed));
    }
  }

  // Update step interval
  if (updateInterval !== updateIntervalSlider.value()) {
    updateInterval = updateIntervalSlider.value();
    // Restart the interval with the new timing
    startSpriteUpdateInterval();
  }

  // Update all labels with current values
  updateLabels();

  // Reset sprites and grid if needed
  if (needsReset) {
    resetSimulation();
    updateSliderRanges();
  }
}

/**
 * Reset the entire simulation with new parameters
 * Clears sprites and reinitializes everything from scratch
 */
function resetSimulation() {
  // Clear existing sprites
  sprites = [];

  // Reinitialize grid
  initializeOccupancyGrid();

  // Create new sprites with updated parameters
  createSprites(spriteCount, cellSize, colorPalette, trailSegments);

  // Apply current fade speed to new sprites
  for (let sprite of sprites) {
    sprite.trailFadeStep = Math.max(1, Number(fadeSpeed));
  }
}

/**
 * Start the timer that updates sprites at regular intervals
 * Uses the current stepInterval value for timing
 */
function startSpriteUpdateInterval() {
  // Clear any existing interval
  if (spriteUpdateInterval) {
    clearInterval(spriteUpdateInterval);
  }

  // Start new interval with current stepInterval value
  spriteUpdateInterval = setInterval(() => {
    for (let sprite of sprites) {
      sprite.update();
    }
  }, updateInterval);
}

/**
 * Update the valid ranges for sliders when parameters change
 * Ensures sliders stay within valid bounds
 */
function updateSliderRanges() {
  // No need to update position sliders since they're removed
  // Area size slider can move freely and will snap to grid in the update function
}

/**
 * Update all slider labels to show current values
 * Called every frame to keep the UI synchronized
 */
function updateLabels() {
  // Update all slider labels with current values
  if (cellSizeLabel) {
    cellSizeLabel.html("Grid Size: " + cellSize);
  }
  if (constraintSizeLabel) {
    constraintSizeLabel.html("Area Size: " + constraintAreaSize);
  }
  if (fadeSpeedLabel) {
    fadeSpeedLabel.html("Fade Speed: " + fadeSpeed);
  }
  if (trailSegmentsLabel) {
    trailSegmentsLabel.html("Trail Segments: " + trailSegments);
  }
  if (spriteCountLabel) {
    spriteCountLabel.html("Num Sprites: " + spriteCount);
  }
  if (updateIntervalLabel) {
    updateIntervalLabel.html("Speed: " + updateInterval + "ms");
  }
}

/**
 * Toggle visibility of the slider controls
 * Switches between showing and hiding the control panel
 */
function toggleSliders() {
  if (sliderContainer.style("display") === "none") {
    sliderContainer.style("display", "block");
    toggleButton.html("Hide Controls");
  } else {
    sliderContainer.style("display", "none");
    toggleButton.html("Show Controls");
  }
}

/**
 * Draw the visual boundary of the constraint area
 * Shows players where sprites are confined to move
 */
function drawConstraintArea() {
  // Adaptive, softer border for better readability at small cells
  const borderThickness = Math.max(
    2,
    Math.min(4, Math.floor(cellSize / 10) || 2)
  );

  stroke(5, 255); // Light gray with a bit of transparency
  strokeWeight(10);
  noFill(); // Just the outline, no fill

  // Draw the boundary rectangle
  rect(
    constraintAreaX - borderThickness / 2,
    constraintAreaY - borderThickness / 2,
    constraintAreaSize + borderThickness,
    constraintAreaSize + borderThickness
  );
}
