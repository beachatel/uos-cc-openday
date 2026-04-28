class ConstraintObject {
  constructor(bodyA, bodyB, options = {}) {
    this.constraint = Matter.Constraint.create({
      bodyA: bodyA || null,
      bodyB: bodyB || null,
      pointA: options.pointA || { x: 0, y: 0 },
      pointB: options.pointB || { x: 0, y: 0 },
      length: options.length ?? 50,
      stiffness: options.stiffness ?? 0.1,
      damping: options.damping ?? 0,
    });
    this.isVisible = options.isVisible !== false;
    Matter.Composite.add(engine.world, this.constraint);
  }

  show() {
    if (!this.isVisible) {
      return;
    }

    const constraint = this.constraint;
    const posA = constraint.bodyA
      ? {
          x: constraint.bodyA.position.x + constraint.pointA.x,
          y: constraint.bodyA.position.y + constraint.pointA.y,
        }
      : constraint.pointA;
    const posB = constraint.bodyB
      ? {
          x: constraint.bodyB.position.x + constraint.pointB.x,
          y: constraint.bodyB.position.y + constraint.pointB.y,
        }
      : constraint.pointB;

    stroke(0);
    strokeWeight(1);
    line(posA.x, posA.y, posB.x, posB.y);
  }

  remove() {
    if (this.constraint) {
      Matter.Composite.remove(engine.world, this.constraint);
      this.constraint = null;
    }
  }
}
