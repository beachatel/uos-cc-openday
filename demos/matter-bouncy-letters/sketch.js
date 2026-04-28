// hydraulic press, mouse/letter interaction

// matter variables
const { Engine, Bodies, Body, Composite, Common } = Matter;
let engine;
let ground;
let leftWall;
let rightWall;

let emitter;
let force;

let inputText = "";
let tick = 0;
let emitIntervalId = null;

let fonts = [];
let font;
let size = 140;

const margin = 220;
let emitSpeed = 400;
let emitterLocation;

// const letters = ["S", "I", "C", "K"];
const letters = ["J", "U", "M", "P", "I", "N", "G"];

// const letters = ["T", "I", "H", "S"];

const springDefaults = {
  EDGE_STIFFNESS: 0.95,
  EDGE_DAMPING: 0.9,
  SUPPORT_STIFFNESS: 0.52,
  SUPPORT_DAMPING: 0.01,
  MAX_SUPPORT_LINKS: 5,
  SUPPORT_RANGE_FACTOR: 0.5,
  CENTER_STIFFNESS: 0.6,
  CENTER_DAMPING: 0.25,
  CONTOUR_GAP_FACTOR: 0.05,
};

const particleDefaults = {
  sampleFactor: 0.95,
  particleRadius: 9,
  options: {
    friction: 0.9,
    restitution: 1.0,
    frictionAir: 0.2,
    density: 0.9,
  },
};

function preload() {
  fonts = ["C64_Pro_Mono-STYLE.otf", "Courier New.ttf", "PartyLET-plain.ttf"];
  for (let font of fonts) {
    loadFont("fonts/" + font);
  }
  console.log(fonts[0]);
  // font = loadFont("fonts/C64_Pro_Mono-STYLE.otf");
  // console.log(font);
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1); // for mapping matter coordinates to p5 canvas coordinates
  colorMode(HSB, 360, 100, 100, 100);
  textFont("monospace");

  //set up matter.js decomp library for complex shapes
  if (window.decomp) {
    Common.setDecomp(window.decomp);
  }

  //initialize matter engine
  engine = Engine.create();
  engine.gravity.x = 0.0;
  engine.gravity.y = 0.9;

  //initialize letter emitter
  force = createVector(-19.0, -24.0);
  emitterLocation = createVector(width + 20, height / 2);
  emitter = new LetterEmitter(
    fonts[0],
    letters,
    springDefaults,
    particleDefaults,
    emitterLocation,
    force,
  );

  emitter.createUI();
  clearTimeout(emitter.emitSpeed); // disable auto-emit; Enter key controls it
  emitter.emitSpeed = null;

  // emitter.wholePhrase(margin);

  //create ground (mirrored to right of centre)
  const groundOptions = {
    isStatic: true,
    friction: 1.0,
    angle: -60,
  };
  ground = Bodies.rectangle(
    width / 2 + 50,
    height / 1.4,
    200,
    30,
    groundOptions,
  );
  Composite.add(engine.world, [ground]);

  const wallOptions = {
    isStatic: true,
    friction: 1.0,
    angle: -70,
  };

  rightWall = Bodies.rectangle(
    width / 2 - 150,
    height / 2.5,
    wallThickness,
    wallHeight,
    wallOptions,
  );

  Composite.add(engine.world, [rightWall]);
}
var wallThickness = 40;
var wallHeight = 200;
function draw() {
  background("#cd4931");

  emitter.run();

  // display ground
  fill("#4d3e82");
  stroke(0);
  strokeWeight(2);
  push();
  translate(ground.position.x, ground.position.y);
  rotate(-60);
  rectMode(CENTER);
  rect(0, 0, 200, 30);
  pop();
  // draw left wall
  push();
  translate(width / 2 - 150, height / 2.5);
  angleMode(RADIANS);
  rotate(-70);
  rectMode(CENTER);
  rect(0, 0, wallThickness, wallHeight);
  pop();
  Engine.update(engine, 1000 / 60); //update matter engine
  tick++;
  drawUI();
}

// ── UI bar ────────────────────────────────────────────────────────────────────
function drawUI() {
  let uiH = 70;
  let uiY = height - uiH;
  let pad = 20;

  noStroke();
  fill(0, 0, 5, 88);
  rect(0, uiY, width, uiH);

  // Hint row
  textAlign(LEFT, CENTER);
  fill(0, 0, 48, 70);
  textSize(12);
  text(
    "ENTER = emit   |   BACKSPACE = edit   |   ESC = clear all   |   DRAG = push",
    pad,
    uiY + 16,
  );

  // Input row – blinking cursor, clips if text overflows
  let cursor = tick % 60 < 30 ? "|" : " ";
  let prefix = "> ";
  let maxW = width - pad * 2 - 14;

  fill(0, 0, 96);
  textSize(24);
  textAlign(LEFT, CENTER);

  let full = prefix + inputText + cursor;
  while (full.length > 2 && textWidth(full) > maxW) {
    full = prefix + full.slice(prefix.length + 1);
  }
  text(full, pad, uiY + 50);
}

// ── Key handling ──────────────────────────────────────────────────────────────
function keyTyped() {
  if (key.length !== 1) return false;
  inputText += key;
  return false; // prevent browser shortcuts
}

function keyPressed() {
  if (keyCode === ENTER) {
    let trimmed = inputText.trim();
    if (trimmed.length > 0) {
      clearInterval(emitIntervalId);
      emitter.letters = [...trimmed].filter((c) => c !== " ");
      emitter.nextLetterIndex = 0;
      emitter.randomLetter(); // fire first letter immediately
      emitIntervalId = setInterval(
        () => emitter.randomLetter(),
        emitter._emitDelay ?? 400,
      );
    }
  } else if (keyCode === BACKSPACE) {
    inputText = inputText.slice(0, -1);
    return false;
  } else if (keyCode === ESCAPE) {
    clearInterval(emitIntervalId);
    emitIntervalId = null;
    for (let lo of emitter.letterObjs) lo.remove();
    emitter.letterObjs = [];
    inputText = "";
  }
}

// ── Mouse: radial push ────────────────────────────────────────────────────────
function mouseDragged() {
  _pushParticles(mouseX, mouseY, 0.06);
}
function mousePressed() {
  _pushParticles(mouseX, mouseY, 0.1);
}

function _pushParticles(mx, my, strength) {
  let radius = 130;
  for (let lo of emitter.letterObjs) {
    for (let p of lo.particles) {
      if (!p.body) continue;
      let px = p.body.position.x;
      let py = p.body.position.y;
      let dx = px - mx;
      let dy = py - my;
      let d = Math.sqrt(dx * dx + dy * dy);
      if (d < radius && d > 0.1) {
        let f = strength * (1 - d / radius);
        Matter.Body.applyForce(p.body, p.body.position, {
          x: (dx / d) * f,
          y: (dy / d) * f,
        });
      }
    }
  }
}

// ── Window resize ─────────────────────────────────────────────────────────────
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  Composite.remove(engine.world, ground);
  Composite.remove(engine.world, rightWall);
  ground = Bodies.rectangle(width / 2 + 50, height / 1.4, 200, 30, {
    isStatic: true,
    friction: 1.0,
    angle: -60,
  });
  rightWall = Bodies.rectangle(
    width / 2 - 150,
    height / 2.5,
    wallThickness,
    wallHeight,
    {
      isStatic: true,
      friction: 1.0,
      angle: -70,
    },
  );
  Composite.add(engine.world, [ground, rightWall]);
}
