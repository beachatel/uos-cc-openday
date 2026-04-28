class Particle {
  constructor(particlesize, colour) {
    this.pos = createVector(random(0, width), random(height)); // Initialize position randomly on the canvas
    this.vel = createVector(0, 0); // Initialize velocity to zero
    this.acc = createVector(random(-1, 1), random(-1, 1)); // Initialize acceleration to zero
    this.maxSpeed = 0.2; // Set the maximum speed of the particle
    this.particlesize = particlesize; // Set the size of the particle
    this.colour = colour; // Set the color of the particle
  }

  follow(vectors) {
    // Convert particle position to flowfield grid indices, clamp to valid range
    let x = floor(this.pos.x / scale);
    let y = floor(this.pos.y / scale);
    x = constrain(x, 0, cols - 1);
    y = constrain(y, 0, rows - 1);
    let index = x + y * cols;
    let force = vectors[index];
    if (force) {
      // apply a copy so the original flowfield vector isn't mutated
      let f = force.copy();
      // scale down the applied force so acceleration isn't huge
      f.mult(0.1);
      this.applyForce(f);
    }
  }

  applyForce(force) {
    this.acc.add(force); // Add the force to the particle's acceleration
  }

  update() {
    this.vel.add(this.acc); // Update velocity based on acceleration
    this.vel.limit(this.maxSpeed); // Limit the velocity to the maximum speed
    this.pos.add(this.vel); // Update position based on velocity
    this.acc.mult(0); // Reset acceleration to zero
  }

  edges() {
    // Handle the particle's edges by wrapping around the canvas
    // use else-if so we don't set x to the opposite side and then immediately trigger the other condition
    if (this.pos.x >= width) this.pos.x = 0;
    else if (this.pos.x <= 0) this.pos.x = width;

    if (this.pos.y >= height) this.pos.y = 0;
    else if (this.pos.y <= 0) this.pos.y = height;
  }

  show() {
    stroke(this.colour); // Set the stroke color to the particle's color
    strokeWeight(this.particlesize); // Set the stroke weight to the particle's size
    point(this.pos.x, this.pos.y); // Draw the particle as a point
  }
}
