let pane;

let params = {
  sz: 75,
  a: 1,
  b: 1,
  m: 8,
  n1: 0.5,
  n2: 0.5,
  n3: 8,
  v: 0.05,
  background: "#ff00dd",
  fill: "#00fd11",
  stroke: "#0077ff",
  animate: false,
  preset: "None",
};

let squares = [];
let needsRebuild = true;
let animT = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  setupGUI();
  populateGrid();
}

function draw() {
  background(params.background);
  pane.refresh();

  document.addEventListener("gesturestart", function (e) {
    e.preventDefault();
  });

  if (needsRebuild) {
    populateGrid();
    needsRebuild = false;
  }

  if (params.animate) {
    animT += 0.02;
    populateGrid();
  }

  stroke(params.stroke);
  fill(params.fill);

  for (let s of squares) {
    s.display();
  }
}

function populateGrid() {
  squares = [];

  for (let x = 0; x < width; x += params.sz) {
    for (let y = 0; y < height; y += params.sz) {
      generateSubdivisions(x, y, params.sz);
    }
  }
}

function generateSubdivisions(x, y, size) {
  let shouldSubdivide;

  if (params.animate) {
    shouldSubdivide = random(1) > 0.5;
  } else {
    shouldSubdivide = noise(x * 0.1, y * 0.1) > 0.5;
  }

  if (size > 20 && shouldSubdivide) {
    let newSize = size / 2;

    generateSubdivisions(x, y, newSize);
    generateSubdivisions(x + newSize, y, newSize);
    generateSubdivisions(x, y + newSize, newSize);
    generateSubdivisions(x + newSize, y + newSize, newSize);
  } else {
    squares.push(new GridSquare(x, y, size));
  }
}

class GridSquare {
  constructor(x, y, sz) {
    this.x = x;
    this.y = y;
    this.sz = sz;
    this.phase = random(TWO_PI);
  }

  display() {
    push();

    stroke(params.stroke);
    noFill();
    rect(this.x, this.y, this.sz, this.sz);

    fill(params.fill);
    noStroke();

    let center = this.sz / 2;
    let maxRadius = this.sz * 0.45;

    beginShape();

    let step = max(params.v, 0.01);

    for (let theta = 0; theta < TWO_PI; theta += step) {
      let rad = r(
        theta,
        params.a + (params.animate ? sin(animT + this.phase) * 0.1 : 0),
        params.b,
        params.m,
        params.n1,
        params.n2 + (params.animate ? sin(animT) * 0.5 : 0),
        params.n3,
      );

      let rMag = constrain(rad, 0, 1) * maxRadius;

      let vx = this.x + center + rMag * cos(theta);
      let vy = this.y + center + rMag * sin(theta);

      vertex(vx, vy);
    }

    endShape(CLOSE);

    pop();
  }
}

function r(theta, a, b, m, n1, n2, n3) {
  let p1 = pow(abs(cos((m * theta) / 4) / a), n2);
  let p2 = pow(abs(sin((m * theta) / 4) / b), n3);
  let sum = p1 + p2;

  return sum === 0 ? 0 : pow(sum, -1 / n1);
}

function randomiseParams() {
  Object.assign(params, {
    a: random(0.2, 3),
    b: random(0.2, 1),
    m: floor(random(1, 15)),
    n1: random(0.2, 5),
    n2: random(0.2, 5),
    n3: random(0.2, 5),
    v: random(0.001, 0.05),
    sz: floor(random(50, 120)),
    background: color(random(255), random(255), random(255)).toString(),
    stroke: color(random(255), random(255), random(255)).toString(),
    fill: color(random(255), random(255), random(255)).toString(),
  });

  needsRebuild = true;
  pane.refresh();
}

function applyPreset(name) {
  if (name === "None") return;

  if (name === "Flower") {
    Object.assign(params, {
      m: 7,
      n1: 0.3,
      n2: 0.3,
      n3: 0.3,
      v: 0.05,
    });
  }

  if (name === "Star") {
    Object.assign(params, {
      m: 8,
      n1: 1,
      n2: 1,
      n3: 1,
      v: 0.03,
    });
  }

  if (name === "Organic") {
    Object.assign(params, {
      m: 3,
      n1: 2,
      n2: 7,
      n3: 7,
      v: 0.08,
    });
  }

  if (name === "Spiky") {
    Object.assign(params, {
      m: 12,
      n1: 0.2,
      n2: 8,
      n3: 8,
      v: 0.02,
    });
  }

  if (name === "Blob") {
    Object.assign(params, {
      m: 5,
      n1: 4,
      n2: 2,
      n3: 2,
      v: 0.1,
    });
  }

  needsRebuild = true;
  pane.refresh();
}

function setupGUI() {
  pane = new Pane({ title: "Parameters" });
  pane.element.classList.add("my-pane");

  pane.addBlade({ view: "separator" });

  pane
    .addBinding(params, "sz", { min: 40, max: 120, step: 1 })
    .on("change", () => (needsRebuild = true));

  pane.addBinding(params, "a", { min: 0.1, max: 2, step: 0.01 });
  pane.addBinding(params, "b", { min: 0.1, max: 2, step: 0.01 });

  pane.addBinding(params, "m", { min: 0, max: 20, step: 1 });
  pane.addBinding(params, "n1", { min: 0.1, max: 10, step: 0.1 });
  pane.addBinding(params, "n2", { min: 0.1, max: 10, step: 0.1 });
  pane.addBinding(params, "n3", { min: 0.1, max: 10, step: 0.1 });

  pane.addBinding(params, "v", { min: 0.01, max: 0.2, step: 0.005 });
  pane.addBinding(params, "animate");

  pane.addBlade({ view: "separator" });

  pane.addBinding(params, "fill");
  pane.addBinding(params, "background");
  pane.addBinding(params, "stroke");

  pane.addBlade({ view: "separator" });

  pane.addButton({ title: "Export Image" }).on("click", () => {
    saveCanvas("image.png");
  });

  pane.addButton({ title: "Randomise" }).on("click", randomiseParams);

  pane.addBlade({ view: "separator" });

  pane
    .addBinding(params, "preset", {
      options: {
        None: "None",
        Flower: "Flower",
        Star: "Star",
        Organic: "Organic",
        Spiky: "Spiky",
        Blob: "Blob",
      },
    })
    .on("change", (ev) => applyPreset(ev.value));
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  needsRebuild = true;
  pane.refresh();
}
