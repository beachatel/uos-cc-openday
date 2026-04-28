class Particle {
  constructor(x, y, radius, velocity, options) {
    this.radius = radius;
    const defaults = {
      friction: 0.0,
      restitution: 1.0,
      frictionAir: 0.03,
      density: 0.21,
    };
    this.velocity = velocity;

    const config = Object.assign({}, defaults, options);
    this.body = Matter.Bodies.circle(x, y, this.radius, config);
    Matter.Composite.add(engine.world, this.body);
    Matter.Body.setVelocity(this.body, {
      x: this.velocity.x,
      y: this.velocity.y,
    });
  }

  show() {
    const { x, y } = this.body.position;
    push();
    translate(x, y);
    noStroke();
    fill(80, 120, 200, 140);
    circle(0, 0, this.radius * 2);
    pop();
  }

  remove() {
    if (this.body) {
      Matter.Composite.remove(engine.world, this.body);
      this.body = null;
    }
  }
}
