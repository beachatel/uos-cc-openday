class Letter {
  constructor(
    x,
    y,
    size,
    font,
    letter,
    springOptions,
    sampleFactor,
    particleOptions,
    particleRadius,
    force,
  ) {
    this.size = size;
    this.letter = letter;
    this.font = font;
    this.sampleFactor = sampleFactor;
    this.particles = [];
    this.constraints = [];
    this.contours = [];
    this.scaffold = null;
    this.isRemoved = false;
    this.particleRadius = particleRadius;
    this.particleOptions = particleOptions;
    this.force = force;

    this.edgeStiffness = springOptions.EDGE_STIFFNESS;
    this.edgeDamping = springOptions.EDGE_DAMPING;
    this.supportStiffness = springOptions.SUPPORT_STIFFNESS;
    this.supportDamping = springOptions.SUPPORT_DAMPING;
    this.maxSupportLinks = springOptions.MAX_SUPPORT_LINKS;
    this.supportRangeFactor = springOptions.SUPPORT_RANGE_FACTOR;
    this.centerStiffness = springOptions.CENTER_STIFFNESS;
    this.centerDamping = springOptions.CENTER_DAMPING;
    this.contourGapFactor = springOptions.CONTOUR_GAP_FACTOR;

    const { contours } = this._buildContours(x, y, size, sampleFactor, letter);
    this._createParticles(contours, { x, y });
    this._linkOutline();
    this._addSupportSprings();
    this._addScaffold();
    // this._applyLaunchVelocity();
  }

  _buildContours(cx, cy, size, sampleFactor, letter) {
    const bounds = this.font.textBounds(letter, 0, 0, size);
    const originX = cx - bounds.w / 2 - bounds.x;
    const originY = cy + bounds.h / 2 - bounds.y;

    const minSpacing =
      (this.particleRadius * 1.4) / Math.max(sampleFactor, 0.1);
    const contours = [];

    // Use the underlying opentype.js glyph path to split subpaths at M
    // (moveTo) commands — this reliably separates outer outlines from inner
    // holes without depending on heuristic gap detection.
    const otFont = this.font.font;
    const glyph = otFont && otFont.charToGlyph && otFont.charToGlyph(letter);

    if (glyph && glyph.getPath) {
      const path = glyph.getPath(originX, originY, size);
      const subpaths = [];
      let cur = null;
      let lx = 0,
        ly = 0; // current pen position

      for (const cmd of path.commands) {
        if (cmd.type === "M") {
          if (cur && cur.length >= 3) subpaths.push(cur);
          cur = [{ x: cmd.x, y: cmd.y }];
          lx = cmd.x;
          ly = cmd.y;
        } else if (cmd.type === "L") {
          if (!cur) continue;
          const steps = Math.max(
            1,
            Math.ceil(Math.hypot(cmd.x - lx, cmd.y - ly) / minSpacing),
          );
          for (let s = 1; s <= steps; s++) {
            cur.push({
              x: lx + ((cmd.x - lx) * s) / steps,
              y: ly + ((cmd.y - ly) * s) / steps,
            });
          }
          lx = cmd.x;
          ly = cmd.y;
        } else if (cmd.type === "C") {
          if (!cur) continue;
          const chordLen =
            Math.hypot(cmd.x1 - lx, cmd.y1 - ly) +
            Math.hypot(cmd.x2 - cmd.x1, cmd.y2 - cmd.y1) +
            Math.hypot(cmd.x - cmd.x2, cmd.y - cmd.y2);
          const steps = Math.max(2, Math.ceil(chordLen / minSpacing));
          for (let s = 1; s <= steps; s++) {
            const t = s / steps,
              mt = 1 - t;
            cur.push({
              x:
                mt * mt * mt * lx +
                3 * mt * mt * t * cmd.x1 +
                3 * mt * t * t * cmd.x2 +
                t * t * t * cmd.x,
              y:
                mt * mt * mt * ly +
                3 * mt * mt * t * cmd.y1 +
                3 * mt * t * t * cmd.y2 +
                t * t * t * cmd.y,
            });
          }
          lx = cmd.x;
          ly = cmd.y;
        } else if (cmd.type === "Q") {
          if (!cur) continue;
          const chordLen =
            Math.hypot(cmd.x1 - lx, cmd.y1 - ly) +
            Math.hypot(cmd.x - cmd.x1, cmd.y - cmd.y1);
          const steps = Math.max(2, Math.ceil(chordLen / minSpacing));
          for (let s = 1; s <= steps; s++) {
            const t = s / steps,
              mt = 1 - t;
            cur.push({
              x: mt * mt * lx + 2 * mt * t * cmd.x1 + t * t * cmd.x,
              y: mt * mt * ly + 2 * mt * t * cmd.y1 + t * t * cmd.y,
            });
          }
          lx = cmd.x;
          ly = cmd.y;
        } else if (cmd.type === "Z") {
          // Close: pen returns to subpath start (no extra sample needed)
          if (cur && cur.length > 0) {
            lx = cur[0].x;
            ly = cur[0].y;
          }
        }
      }
      if (cur && cur.length >= 3) subpaths.push(cur);

      for (const sp of subpaths) {
        const simplified = this._simplifyContour(sp, minSpacing);
        if (simplified.length >= 3) contours.push(simplified);
      }
    } else {
      // Fallback: textToPoints + spatial gap detection
      const rawPoints = this.font.textToPoints(letter, originX, originY, size, {
        sampleFactor: Math.min(Math.max(sampleFactor, 0.1), 1.5),
      });
      const gapThreshold = Math.max(
        size * this.contourGapFactor,
        this.particleRadius * 6,
      );
      let current = [];
      for (let i = 0; i < rawPoints.length; i++) {
        const pt = { x: rawPoints[i].x, y: rawPoints[i].y };
        if (current.length > 0) {
          const prevRaw = rawPoints[i - 1];
          const jump = Math.hypot(pt.x - prevRaw.x, pt.y - prevRaw.y);
          if (jump > gapThreshold) {
            const simplified = this._simplifyContour(current, minSpacing);
            if (simplified.length >= 3) contours.push(simplified);
            current = [];
          }
        }
        current.push(pt);
      }
      if (current.length >= 3) {
        const simplified = this._simplifyContour(current, minSpacing);
        if (simplified.length >= 3) contours.push(simplified);
      }
    }

    return { contours };
  }

  _simplifyContour(points, minSpacing) {
    if (points.length <= 3) {
      return points.slice();
    }

    const simplified = [points[0]];
    let lastKept = points[0];

    for (let i = 1; i < points.length; i++) {
      const pt = points[i];
      const dist = Math.hypot(pt.x - lastKept.x, pt.y - lastKept.y);
      if (dist >= minSpacing) {
        simplified.push(pt);
        lastKept = pt;
      }
    }

    return simplified.length >= 3 ? simplified : points.slice();
  }

  _createParticles(contours, fallbackCenter) {
    for (const contour of contours) {
      if (contour.length < 3) {
        continue;
      }

      const contourIndices = [];
      for (const point of contour) {
        const particle = new Particle(
          point.x,
          point.y,
          this.particleRadius,
          this.force,
          { ...this.particleOptions.options },
        );
        this.particles.push(particle);
        contourIndices.push(this.particles.length - 1);
      }

      if (contourIndices.length >= 3) {
        this.contours.push(contourIndices);
      }
    }

    if (this.particles.length === 0 && fallbackCenter) {
      const half = this.size * 0.25;
      const fallbackContour = [
        { x: fallbackCenter.x - half, y: fallbackCenter.y - half },
        { x: fallbackCenter.x + half, y: fallbackCenter.y - half },
        { x: fallbackCenter.x + half, y: fallbackCenter.y + half },
        { x: fallbackCenter.x - half, y: fallbackCenter.y + half },
      ];

      const contourIndices = [];
      for (const point of fallbackContour) {
        const particle = new Particle(
          point.x,
          point.y,
          this.particleRadius,
          this.force,
          { ...this.particleOptions.options },
        );
        this.particles.push(particle);
        contourIndices.push(this.particles.length - 1);
      }

      this.contours.push(contourIndices);
    }
  }

  // _applyLaunchVelocity() {
  //   if (!this.force) {
  //     return;
  //   }

  //   const velocity = {
  //     x: Number.isFinite(this.force.x) ? this.force.x : 0,
  //     y: Number.isFinite(this.force.y) ? this.force.y : 0,
  //   };

  //   if (velocity.x === 0 && velocity.y === 0) {
  //     return;
  //   }

  //   if (this.scaffold) {
  //     Matter.Body.setVelocity(this.scaffold, velocity);
  //   }

  //   for (const particle of this.particles) {
  //     Matter.Body.setVelocity(particle.body, velocity);
  //   }
  // }

  _linkOutline() {
    this.edgePairs = new Set();

    for (const contour of this.contours) {
      const count = contour.length;
      if (count < 2) {
        continue;
      }

      for (let i = 0; i < count; i++) {
        const currentIndex = contour[i];
        const nextIndex = contour[(i + 1) % count];
        const bodyA = this.particles[currentIndex].body;
        const bodyB = this.particles[nextIndex].body;
        const dist = distanceBetweenBodies(bodyA, bodyB);

        if (dist < 0.5) {
          continue;
        }

        const constraint = new ConstraintObject(bodyA, bodyB, {
          length: dist,
          stiffness: this.edgeStiffness,
          damping: this.edgeDamping,
          isVisible: true,
        });
        this.constraints.push(constraint);
        this.edgePairs.add(pairKey(currentIndex, nextIndex));
      }
    }
  }

  _addSupportSprings() {
    const supportRange = this.size * this.supportRangeFactor;
    const createdPairs = new Set(this.edgePairs);

    for (let i = 0; i < this.particles.length; i++) {
      const bodyA = this.particles[i].body;
      const candidates = [];

      for (let j = 0; j < this.particles.length; j++) {
        if (i === j) {
          continue;
        }

        const bodyB = this.particles[j].body;
        const dist = distanceBetweenBodies(bodyA, bodyB);
        candidates.push({ index: j, dist });
      }

      candidates.sort((a, b) => a.dist - b.dist);

      let added = 0;
      for (const { index: j, dist } of candidates) {
        if (dist > supportRange) {
          break;
        }

        if (dist < this.particleRadius * 0.5) {
          continue;
        }

        const key = pairKey(i, j);
        if (createdPairs.has(key)) {
          continue;
        }

        const support = new ConstraintObject(bodyA, this.particles[j].body, {
          length: dist,
          stiffness: this.supportStiffness,
          damping: this.supportDamping,
          isVisible: false,
        });

        this.constraints.push(support);
        createdPairs.add(key);
        added++;

        if (added >= this.maxSupportLinks) {
          break;
        }
      }
    }
  }

  _addScaffold() {
    if (this.particles.length === 0) {
      return;
    }

    let sumX = 0;
    let sumY = 0;
    for (const particle of this.particles) {
      sumX += particle.body.position.x;
      sumY += particle.body.position.y;
    }

    const centerX = sumX / this.particles.length;
    const centerY = sumY / this.particles.length;
    const scaffoldRadius = Math.max(
      this.particleRadius * 1.2,
      this.size * 0.04,
    );

    this.scaffold = Matter.Bodies.circle(centerX, centerY, scaffoldRadius, {
      inertia: Infinity,
      frictionAir: 0.05,
      collisionFilter: { category: 0x0004, mask: 0 },
      render: { visible: false },
    });

    Matter.Composite.add(engine.world, this.scaffold);

    for (const particle of this.particles) {
      const restLength = distanceBetweenBodies(particle.body, this.scaffold);
      const spine = new ConstraintObject(particle.body, this.scaffold, {
        length: restLength,
        stiffness: this.centerStiffness,
        damping: this.centerDamping,
        isVisible: false,
      });
      this.constraints.push(spine);
    }
  }

  show() {
    if (this.isRemoved) {
      return;
    }

    stroke(0);
    strokeWeight(2);
    fill("#00c38f");

    if (this.contours.length === 0) {
      return;
    }

    // Snapshot current positions for all contours
    const positions = this.contours.map((contour) =>
      contour.map((index) => this.particles[index].body.position),
    );

    if (positions.length === 1) {
      // No holes — simple path
      beginShape();
      for (const pos of positions[0]) vertex(pos.x, pos.y);
      endShape(CLOSE);
      return;
    }

    // Multiple subpaths: find the outer contour (largest absolute signed area)
    // and draw the rest as holes using beginContour/endContour.
    // p5.js requires hole vertices to wind in the OPPOSITE direction to the
    // outer shape, otherwise the hole is not cut out.
    const signedArea = (pts) => {
      let a = 0;
      for (let i = 0; i < pts.length; i++) {
        const j = (i + 1) % pts.length;
        a += pts[i].x * pts[j].y - pts[j].x * pts[i].y;
      }
      return a / 2;
    };

    const areas = positions.map(signedArea);
    let outerIdx = 0;
    for (let i = 1; i < areas.length; i++) {
      if (Math.abs(areas[i]) > Math.abs(areas[outerIdx])) outerIdx = i;
    }
    const outerSign = Math.sign(areas[outerIdx]);

    beginShape();
    for (const pos of positions[outerIdx]) vertex(pos.x, pos.y);

    for (let i = 0; i < positions.length; i++) {
      if (i === outerIdx) continue;
      const pts = positions[i];
      beginContour();
      // Reverse if winding matches outer so it winds opposite (cuts a hole)
      if (Math.sign(areas[i]) === outerSign) {
        for (let j = pts.length - 1; j >= 0; j--) vertex(pts[j].x, pts[j].y);
      } else {
        for (const pos of pts) vertex(pos.x, pos.y);
      }
      endContour();
    }

    endShape(CLOSE);
  }

  isOffscreen(limitY) {
    if (this.isRemoved || this.particles.length === 0) {
      return false;
    }

    const threshold = limitY ?? height + this.size;
    return this.particles.every((particle) => {
      const body = particle.body;
      return body && body.position.y - this.particleRadius > threshold;
    });
  }

  remove() {
    if (this.isRemoved) {
      return;
    }
    this.isRemoved = true;

    for (const constraint of this.constraints) {
      constraint.remove();
    }
    this.constraints = [];

    for (const particle of this.particles) {
      particle.remove();
    }
    this.particles = [];

    if (this.scaffold) {
      Matter.Composite.remove(engine.world, this.scaffold);
      this.scaffold = null;
    }
  }
}

function pairKey(a, b) {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

function distanceBetweenBodies(bodyA, bodyB) {
  const dx = bodyB.position.x - bodyA.position.x;
  const dy = bodyB.position.y - bodyA.position.y;
  return Math.sqrt(dx * dx + dy * dy);
}
