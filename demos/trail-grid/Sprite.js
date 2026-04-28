/**
 * Sprite Class - Represents a moving entity with trail effects
 *
 * This class handles sprite movement, collision detection with occupied grid cells,
 * trail rendering with fading effects, and constraint area boundary wrapping.
 *
 * Features:
 * - Grid-based movement and collision detection
 * - Visual trail with configurable fade speed
 * - Constraint area boundary wrapping
 * - Collision avoidance with other sprites and trail segments
 */
class Sprite {
  /**
   * Create a new sprite
   * @param {number} startX - Starting X position in pixels
   * @param {number} startY - Starting Y position in pixels
   * @param {number} spriteSize - Size of the sprite (should match grid cell size)
   * @param {Array} spriteColor - RGB color array [r, g, b]
   * @param {number} trailLength - How many trail segments to maintain
   */
  constructor(startX, startY, spriteSize, spriteColor, trailSegments) {
    // Sprite position and visual properties
    this.x = startX;
    this.y = startY;
    this.s = spriteSize; // Size (should match grid cell size)
    this.c = spriteColor; // Color as RGB array
    this.speed = this.s; // Movement speed (one grid cell per update)

    // Trail system properties
    this.trail = []; // Array of trail segments with fading alpha
    this.alpha = 255; // Current sprite opacity
    // Interpret incoming trailSegments as desired number of segments (more intuitive)
    this.maxTrailSegments = Math.max(1, Math.floor(trailSegments));
    // Fade step derived from segment count to keep a visible gradient
    this.trailFadeStep = Math.max(1, Math.floor(255 / this.maxTrailSegments));

    // Register this sprite's starting position in the grid
    this.registerCurrentCell();
  }

  /**
   * Handle sprite movement at constraint area boundaries
   * Implements wrapping behavior - sprites wrap to opposite side when hitting edges
   */
  checkEdges() {
    // Define the boundaries of the constraint area
    const constraintLeft = constraintAreaX;
    const constraintRight = constraintAreaX + constraintAreaSize - this.s;
    const constraintTop = constraintAreaY;
    const constraintBottom = constraintAreaY + constraintAreaSize - this.s;

    // Wrap horizontally when hitting left/right boundaries
    if (this.x > constraintRight) this.x = constraintLeft;
    if (this.x < constraintLeft) this.x = constraintRight;

    // Wrap vertically when hitting top/bottom boundaries
    if (this.y > constraintBottom) this.y = constraintTop;
    if (this.y < constraintTop) this.y = constraintBottom;
  }
  /**
   * Update sprite position and trail
   * This is called every frame by the sprite update interval
   *
   * Movement Logic:
   * 1. Get current grid coordinates
   * 2. Find next available empty cell (collision detection)
   * 3. Add current position to trail before moving
   * 4. Update grid occupancy (mark old cell empty, new cell occupied)
   * 5. Move to new position
   * 6. Fade existing trail segments
   */
  update() {
    // Convert pixel coordinates to grid coordinates within constraint area
    const currentGridPosition = this.getGridCoordsFromXY(this.x, this.y);
    const column = currentGridPosition.col;
    const row = currentGridPosition.row;

    // Attempt to find an empty neighboring cell to move to
    const nextEmptyCell = this.findNextEmptyCell(column, row);

    // If we found a valid cell to move to
    if (nextEmptyCell) {
      // Mark current cell as no longer occupied by sprite body first
      // Then add a trail segment so the cell remains occupied by the trail
      this.updateGridCell(column, row, -1);
      this.addTrailSegment(column, row);

      // Convert new grid coordinates back to pixel coordinates
      this.x = constraintAreaX + nextEmptyCell.col * this.s;
      this.y = constraintAreaY + nextEmptyCell.row * this.s;

      // Mark new cell as occupied by this sprite
      this.updateGridCell(nextEmptyCell.col, nextEmptyCell.row, 1);
    }

    // Fade all trail segments each frame
    this.fadeTrail();
  }
  /**
   * Render the sprite and its trail
   *
   * Trail Rendering:
   * - Each trail segment fades based on its alpha value
   * - Newer segments are more opaque, older segments more transparent
   * - Uses the sprite's color with varying alpha for trail effect
   *
   * Sprite Rendering:
   * - Renders as a solid rectangle at current position
   * - Uses full opacity for the main sprite body
   */
  show() {
    let segmentIndex = 0;

    // Render each trail segment with its current fade level
    for (let trailSegment of this.trail) {
      // Set color with fading alpha based on trail segment age
      fill(
        this.c.levels[0], // Red component
        this.c.levels[1], // Green component
        this.c.levels[2], // Blue component
        trailSegment.a // Alpha (transparency) - fades over time
      );
      noStroke(); // No outline for trail segments

      // Draw the trail segment as a rectangle
      rect(trailSegment.x, trailSegment.y, this.s, this.s);
      segmentIndex++;
    }

    // Render the main sprite body with full opacity
    fill(this.c.levels[0], this.c.levels[1], this.c.levels[2], this.alpha);
    noStroke();
    rect(this.x, this.y, this.s, this.s);
  }

  /**
   * Convert pixel coordinates to grid coordinates within the constraint area
   *
   * This function handles coordinate conversion from world space to grid space,
   * accounting for the constraint area offset and wrapping behavior.
   *
   * @param {number} x - X coordinate in pixels
   * @param {number} y - Y coordinate in pixels
   * @returns {Object} Grid coordinates {col, row} within constraint area
   */
  getGridCoordsFromXY(x, y) {
    // Calculate how many grid cells fit in the constraint area
    const constraintColumns = Math.floor(constraintAreaSize / this.s);
    const constraintRows = Math.floor(constraintAreaSize / this.s);

    // Convert world coordinates to constraint-area-relative coordinates
    const relativeX = x - constraintAreaX;
    const relativeY = y - constraintAreaY;

    // Handle wrapping within the constraint area boundaries
    const wrappedX =
      ((relativeX % constraintAreaSize) + constraintAreaSize) %
      constraintAreaSize;
    const wrappedY =
      ((relativeY % constraintAreaSize) + constraintAreaSize) %
      constraintAreaSize;

    // Convert to grid cell coordinates and clamp to valid range
    const column = Math.max(
      0,
      Math.min(constraintColumns - 1, Math.floor(wrappedX / this.s))
    );
    const row = Math.max(
      0,
      Math.min(constraintRows - 1, Math.floor(wrappedY / this.s))
    );

    return { col: column, row: row };
  }

  /**
   * Register this sprite's current position in the grid occupancy system
   * Called during sprite initialization to mark starting cell as occupied
   */
  registerCurrentCell() {
    const currentPosition = this.getGridCoordsFromXY(this.x, this.y);
    this.updateGridCell(currentPosition.col, currentPosition.row, 1);
  }

  /**
   * Update grid cell occupancy count
   *
   * This function manages the grid occupancy system that tracks how many
   * sprites/trail segments occupy each cell for collision detection.
   *
   * @param {number} col - Grid column within constraint area
   * @param {number} row - Grid row within constraint area
   * @param {number} delta - Change in occupancy (+1 to occupy, -1 to free)
   */
  updateGridCell(col, row, delta) {
    // Calculate constraint area dimensions in grid cells
    const constraintColumns = Math.floor(constraintAreaSize / this.s);
    const constraintRows = Math.floor(constraintAreaSize / this.s);

    // Validate coordinates are within constraint area bounds
    if (
      col < 0 ||
      col >= constraintColumns ||
      row < 0 ||
      row >= constraintRows
    ) {
      return; // Invalid coordinates, do nothing
    }

    // Convert constraint-relative coordinates to global grid coordinates
    const globalColumn = Math.floor(constraintAreaX / this.s) + col;
    const globalRow = Math.floor(constraintAreaY / this.s) + row;

    // Validate global grid coordinates and update occupancy count
    if (
      !occupancyGrid[globalColumn] ||
      typeof occupancyGrid[globalColumn][globalRow] !== "number"
    ) {
      return; // Invalid global coordinates, do nothing
    }

    // Update the occupancy count for this cell (ensure it doesn't go below 0)
    occupancyGrid[globalColumn][globalRow] = Math.max(
      0,
      occupancyGrid[globalColumn][globalRow] + delta
    );
  }

  isCellEmpty(col, row) {
    // Check bounds within the constraint area
    const constraintCols = Math.floor(constraintAreaSize / this.s);
    const constraintRows = Math.floor(constraintAreaSize / this.s);

    if (col < 0 || col >= constraintCols || row < 0 || row >= constraintRows) {
      return false;
    }

    // Convert constraint-relative coordinates to global grid coordinates
    const globalCol = Math.floor(constraintAreaX / this.s) + col;
    const globalRow = Math.floor(constraintAreaY / this.s) + row;

    if (
      !occupancyGrid[globalCol] ||
      typeof occupancyGrid[globalCol][globalRow] !== "number"
    ) {
      return false;
    }
    return occupancyGrid[globalCol][globalRow] === 0;
  }

  findNextEmptyCell(col, row) {
    const available = this.getEmptyNeighbors(col, row);
    if (available.length === 0) {
      return null;
    }
    const index = Math.floor(random(available.length));
    return available[index];
  }

  getEmptyNeighbors(col, row) {
    const constraintCols = Math.floor(constraintAreaSize / this.s);
    const constraintRows = Math.floor(constraintAreaSize / this.s);
    const directions = [
      { dx: 1, dy: 0 },
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
    ];

    const neighbors = [];
    for (const { dx, dy } of directions) {
      const candidateCol = (col + dx + constraintCols) % constraintCols;
      const candidateRow = (row + dy + constraintRows) % constraintRows;
      if (this.isCellEmpty(candidateCol, candidateRow)) {
        neighbors.push({ col: candidateCol, row: candidateRow });
      }
    }
    return neighbors;
  }

  addTrailSegment(col, row) {
    // Convert grid coordinates to pixel coordinates for rendering
    const pixelX = constraintAreaX + col * this.s;
    const pixelY = constraintAreaY + row * this.s;

    this.trail.push({
      col,
      row,
      x: pixelX,
      y: pixelY,
      a: 255,
    });
    // Mark trail segments as occupied in the grid
    this.updateGridCell(col, row, 1);

    // Enforce maximum number of trail segments (most intuitive "length")
    if (this.trail.length > this.maxTrailSegments) {
      const removed = this.trail.shift();
      // Free the grid cell previously occupied by the oldest trail segment
      this.updateGridCell(removed.col, removed.row, -1);
    }
  }

  fadeTrail() {
    for (let i = this.trail.length - 1; i >= 0; i--) {
      const segment = this.trail[i];
      segment.a = Math.max(0, segment.a - this.trailFadeStep);
      if (segment.a === 0) {
        // Remove trail segment from grid when it fades completely
        this.updateGridCell(segment.col, segment.row, -1);
        this.trail.splice(i, 1);
      }
    }
  }
}
