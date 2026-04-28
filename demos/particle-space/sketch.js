// A programme with floating 2D particles connected by
// lines based on their proximity to their neighbours
//Dr. Stuart Haffenden 24/09/2025

let particles = [];
let numParticles = 150;
let pSize = 8;
let colour;
let scale = 10; // size of each flowfield cell
let cols, rows;
let zoff = 0;
let vectors = [];
let start = 0;

// parameter defaults
let sNoiseScale, sNoiseXYInc, sNoiseZInc, sAngleMult, sStartInc;
let sLineDist, sMaxConn;
let sRepulsionRadius, sRepulsionStrength;
let closeBtn;
let palette;

let uiContainer;
let baseWidth = 800;
let baseHeight = 800;
let cnv;

function setup() {
  pixelDensity(2);
  cnv = createCanvas(baseWidth, baseHeight);
  // ensure page has no default margins so fullscreen canvas truly fills viewport
  document.documentElement.style.height = "100%";
  document.body.style.margin = "0";
  document.body.style.padding = "0";
  document.body.style.height = "100%";

  // create UI controls as a fixed, responsive panel on the left center of the viewport
  uiContainer = createDiv();
  uiContainer.id("tools");
  uiContainer.style("position", "fixed");
  uiContainer.style("left", "40px");
  uiContainer.style("top", "50%");
  uiContainer.style("transform", "translateY(-50%)");
  uiContainer.style("max-height", "80vh");
  uiContainer.style("overflow", "auto");
  uiContainer.style("width", "260px");
  uiContainer.style("padding", "8px");
  uiContainer.style("background", "rgba(255,255,255,255)");
  uiContainer.style("border-radius", "8px");
  uiContainer.style("z-index", "10001");
  uiContainer.style("display", "none");

  // // create button to hide/show controls

  // create a persistent toggle button on the left edge with an arrow
  // parent to document.body so it remains visible when the tools div is hidden
  closeBtn = createButton("▶");
  closeBtn.id("closebtn");
  closeBtn.parent(document.body);
  // style as a vertical rectangle on the left side, vertically centered
  closeBtn.style("position", "fixed");
  closeBtn.style("left", "1px");
  closeBtn.style("top", "50%");
  closeBtn.style("transform", "translateY(-50%)");
  closeBtn.style("width", "20px");
  closeBtn.style("height", "64px");
  closeBtn.style("display", "flex");
  closeBtn.style("align-items", "center");
  closeBtn.style("justify-content", "center");
  closeBtn.style("background", "#222");
  closeBtn.style("color", "#fff");
  closeBtn.style("border", "1px solid rgba(255,255,255,0.1)");
  closeBtn.style("border-radius", "6px");
  closeBtn.style("cursor", "pointer");
  closeBtn.style("z-index", "10000");

  // toggle function updates the tools visibility and the arrow direction
  function toggleTools() {
    let el = document.getElementById("tools");
    if (!el) return;
    if (el.style.display === "none") {
      el.style.display = "block";
      closeBtn.html("◀"); // point left to indicate 'close'
    } else {
      el.style.display = "none";
      closeBtn.html("▶"); // point right to indicate 'open'
    }
  }

  // initial arrow: point right to match user's request (they can toggle to change)
  closeBtn.html("▶");
  closeBtn.mousePressed(toggleTools);

  // noise XY increment
  createP("Noise Scale").parent(uiContainer);
  sNoiseScale = createSlider(5, width / 8, 10, 1);
  sNoiseScale.parent(uiContainer);
  let sp0 = createSpan(" " + sNoiseScale.value());
  sp0.parent(uiContainer);
  sNoiseScale.input(() => sp0.html(" " + sNoiseScale.value()));

  // noise XY increment
  createP("Noise XY increment").parent(uiContainer);
  // finer, more typical range for XY noise step: 0.005 - 0.2
  sNoiseXYInc = createSlider(0.0005, 0.2, 0.05, 0.0005);
  sNoiseXYInc.parent(uiContainer);
  let sp1 = createSpan(" " + sNoiseXYInc.value().toFixed(3));
  sp1.parent(uiContainer);
  sNoiseXYInc.input(() => sp1.html(" " + sNoiseXYInc.value().toFixed(3)));

  // noise Z increment
  createP("Noise Z increment").parent(uiContainer);
  // much smaller typical z-step for smooth animation: 0.0001 - 0.01
  sNoiseZInc = createSlider(0.0001, 0.01, 0.002, 0.0001);
  sNoiseZInc.parent(uiContainer);
  let sp2 = createSpan(" " + sNoiseZInc.value().toFixed(4));
  sp2.parent(uiContainer);
  sNoiseZInc.input(() => sp2.html(" " + sNoiseZInc.value().toFixed(4)));

  // start increment (anim speed)
  createP("Start increment").parent(uiContainer);
  sStartInc = createSlider(0.00005, 0.003, 0.0001, 0.00001);
  sStartInc.parent(uiContainer);
  let sp4 = createSpan(" " + sStartInc.value().toFixed(6));
  sp4.parent(uiContainer);
  sStartInc.input(() => sp4.html(" " + sStartInc.value().toFixed(6)));

  // angle multiplier for noise -> angle
  createP("Noise angle multiplier").parent(uiContainer);
  sAngleMult = createSlider(1, 10, 5, 1);
  sAngleMult.parent(uiContainer);
  let sp3 = createSpan(" " + sAngleMult.value());
  sp3.parent(uiContainer);
  sAngleMult.input(() => sp3.html(" " + sAngleMult.value()));

  // line distance
  createP("Line distance threshold").parent(uiContainer);
  sLineDist = createSlider(10, 200, 40, 1);
  sLineDist.parent(uiContainer);
  let sp5 = createSpan(" " + sLineDist.value());
  sp5.parent(uiContainer);
  sLineDist.input(() => sp5.html(" " + sLineDist.value()));

  // max connections
  createP("Max connections per particle").parent(uiContainer);
  sMaxConn = createSlider(1, 15, 3, 1);
  sMaxConn.parent(uiContainer);
  let sp6 = createSpan(" " + sMaxConn.value());
  sp6.parent(uiContainer);
  sMaxConn.input(() => sp6.html(" " + sMaxConn.value()));

  // repulsion radius
  createP("Repulsion radius").parent(uiContainer);
  sRepulsionRadius = createSlider(5, 300, 40, 1);
  sRepulsionRadius.parent(uiContainer);
  let sp7 = createSpan(" " + sRepulsionRadius.value());
  sp7.parent(uiContainer);
  sRepulsionRadius.input(() => sp7.html(" " + sRepulsionRadius.value()));

  // repulsion strength
  createP("Repulsion strength").parent(uiContainer);
  sRepulsionStrength = createSlider(0, 3, 0.3, 0.01);
  sRepulsionStrength.parent(uiContainer);
  let sp8 = createSpan(" " + sRepulsionStrength.value());
  sp8.parent(uiContainer);
  sRepulsionStrength.input(() => sp8.html(" " + sRepulsionStrength.value()));
  scale = sNoiseScale.value();
  cols = floor(width / scale);
  rows = floor(height / scale);
  // initialize flowfield
  for (let i = 0; i < cols * rows; i++) {
    vectors[i] = createVector(0, 0);
  }
  for (let i = 0; i < numParticles; i++) {
    // colour = color(random(255), random(255), random(255), 1);
    colour = color(150, 0);
    particles.push(new Particle(pSize, colour));
  }
  // define a colour palette (semi-transparent) for triangle fills
  palette = [
    color("#6fb6ba"),
    color("#b1d9c3"),
    color("#eb5e54"),
    color("#f6c900"),
    color("#d8d2c4"),
    color("#00313d"),
  ];
}

// Toggle fullscreen and resize canvas; keep particle density by adding/removing particles
function toggleFullscreenMode() {
  // compute current density
  let oldW = width;
  let oldH = height;
  let oldArea = max(1, oldW * oldH);
  let density = particles.length / oldArea;

  let wantFull = !fullscreen();
  fullscreen(wantFull);

  // choose new size
  let newW = wantFull ? windowWidth : baseWidth;
  let newH = wantFull ? windowHeight : baseHeight;

  // resize the canvas and update grid variables
  resizeCanvas(newW, newH);
  // position the canvas to cover the fullscreen area exactly
  if (wantFull) {
    cnv.style("position", "fixed");
    cnv.style("top", "0px");
    cnv.style("left", "0px");
    cnv.style("z-index", "0");
    // ensure CSS size matches viewport so there is no gap
    cnv.style("width", "100vw");
    cnv.style("height", "100vh");
    // hide page scrollbars which can introduce extra space
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    // hide tools while fullscreen to avoid extra page height
    if (uiContainer && uiContainer.elt) uiContainer.elt.style.display = "none";
  } else {
    // restore to document flow
    cnv.style("position", "static");
    cnv.style("top", null);
    cnv.style("left", null);
    cnv.style("width", null);
    cnv.style("height", null);
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
    if (uiContainer && uiContainer.elt) uiContainer.elt.style.display = "block";
  }
  scale = sNoiseScale ? sNoiseScale.value() : scale;
  cols = floor(width / scale);
  rows = floor(height / scale);

  // reinit vectors array to match new cols/rows
  vectors = new Array(cols * rows);
  for (let i = 0; i < vectors.length; i++) vectors[i] = createVector(0, 0);

  // add or remove particles to maintain density
  let newArea = max(1, newW * newH);
  let target = Math.round(density * newArea);
  if (target > particles.length) {
    let toAdd = target - particles.length;
    for (let i = 0; i < toAdd; i++) {
      let c = color(150, 0);
      let p = new Particle(pSize, c);
      // place new particles anywhere within the new canvas
      p.pos = createVector(random(width), random(height));
      particles.push(p);
    }
  } else if (target < particles.length) {
    // remove excess particles
    particles.splice(target, particles.length - target);
  }
}

function keyPressed() {
  if (key === "f" || key === "F") {
    toggleFullscreenMode();
  }
}

function draw() {
  background(255);

  // read UI-controlled parameters
  let lineDist = sLineDist ? sLineDist.value() : 40;
  let maxConnections = sMaxConn ? int(sMaxConn.value()) : 3;
  scale = sNoiseScale ? sNoiseScale.value() : scale;
  cols = floor(width / scale);
  rows = floor(height / scale);

  // build Perlin noise flowfield
  let xoff = start;
  for (let x = 0; x < cols; x++) {
    let yoff = 0;
    for (let y = 0; y < rows; y++) {
      let index = x + y * cols;
      let angle = noise(xoff, yoff, zoff) * TWO_PI * sAngleMult.value();
      let v = p5.Vector.fromAngle(angle);
      v.setMag(1);
      vectors[index] = v;
      yoff += sNoiseXYInc.value();
    }
    xoff += sNoiseXYInc.value();
  }
  zoff += sNoiseZInc.value();

  // apply grid-based, softened repulsion to reduce overlap (wrap-aware)
  const repulsionRadius = sRepulsionRadius ? sRepulsionRadius.value() : 40; // distance within which particles repel
  const maxRepel = sRepulsionStrength ? sRepulsionStrength.value() : 0.3; // maximum force magnitude applied at zero distance
  const cellSize = repulsionRadius; // grid cell size
  const gridCols = Math.ceil(width / cellSize);
  const gridRows = Math.ceil(height / cellSize);
  // create empty grid buckets
  let grid = new Array(gridCols * gridRows);
  for (let i = 0; i < grid.length; i++) grid[i] = [];
  // insert particles into grid
  for (let i = 0; i < particles.length; i++) {
    let cx = Math.floor(particles[i].pos.x / cellSize) % gridCols;
    let cy = Math.floor(particles[i].pos.y / cellSize) % gridRows;
    if (cx < 0) cx += gridCols;
    if (cy < 0) cy += gridRows;
    grid[cx + cy * gridCols].push(i);
  }

  // for each particle, check neighbours in adjacent cells and apply softened repulsion
  for (let i = 0; i < particles.length; i++) {
    let pi = particles[i];
    let cx = Math.floor(pi.pos.x / cellSize) % gridCols;
    let cy = Math.floor(pi.pos.y / cellSize) % gridRows;
    if (cx < 0) cx += gridCols;
    if (cy < 0) cy += gridRows;

    for (let dxCell = -1; dxCell <= 1; dxCell++) {
      for (let dyCell = -1; dyCell <= 1; dyCell++) {
        let ncx = (cx + dxCell + gridCols) % gridCols;
        let ncy = (cy + dyCell + gridRows) % gridRows;
        let bucket = grid[ncx + ncy * gridCols];
        for (let k = 0; k < bucket.length; k++) {
          let j = bucket[k];
          if (j <= i) continue; // avoid double-processing
          let pj = particles[j];

          // shortest displacement with wrapping
          let dx = pj.pos.x - pi.pos.x;
          if (abs(dx) > width / 2) dx += dx > 0 ? -width : width;
          let dy = pj.pos.y - pi.pos.y;
          if (abs(dy) > height / 2) dy += dy > 0 ? -height : height;

          let d = sqrt(dx * dx + dy * dy);
          if (d > 0 && d < repulsionRadius) {
            // normalized direction from i -> j
            let nx = dx / d;
            let ny = dy / d;
            // softened falloff (quadratic): stronger when much closer
            let t = 1 - d / repulsionRadius;
            let strength = maxRepel * (t * t);
            // avoid singularity at extremely small distances
            if (d < 0.001) {
              // random small direction
              let angle = random(TWO_PI);
              nx = cos(angle);
              ny = sin(angle);
            }
            // apply equal and opposite forces (split between the two)
            let fx = nx * strength;
            let fy = ny * strength;
            pi.applyForce(createVector(-fx, -fy));
            pj.applyForce(createVector(fx, fy));
          }
        }
      }
    }
  }

  // update particles (apply flow then integrate)
  for (let particle of particles) {
    particle.follow(vectors);
    particle.update();
    particle.edges();
    particle.show();
  }

  // compute edges (but don't draw yet) and adjacency for triangle detection
  let connections = new Array(particles.length).fill(0);
  let adjacency = new Array(particles.length);
  for (let i = 0; i < particles.length; i++) adjacency[i] = new Set();
  let edges = [];

  for (let i = 0; i < particles.length; i++) {
    if (connections[i] >= maxConnections) continue;
    for (let j = i + 1; j < particles.length; j++) {
      if (connections[i] >= maxConnections) break;
      if (connections[j] >= maxConnections) continue;

      // shortest displacement with wrapping for distance test
      let dx = particles[j].pos.x - particles[i].pos.x;
      if (abs(dx) > width / 2) dx += dx > 0 ? -width : width;
      let dy = particles[j].pos.y - particles[i].pos.y;
      if (abs(dy) > height / 2) dy += dy > 0 ? -height : height;
      let d = sqrt(dx * dx + dy * dy);

      if (d < lineDist) {
        // record edge
        adjacency[i].add(j);
        adjacency[j].add(i);
        connections[i]++;
        connections[j]++;
        edges.push([i, j]);
      }
    }
  }

  // draw filled triangles for mutually connected triplets
  noStroke();
  for (let i = 0; i < particles.length; i++) {
    let neigh = Array.from(adjacency[i]);
    if (neigh.length < 2) continue;
    neigh.sort((a, b) => a - b);
    for (let a = 0; a < neigh.length; a++) {
      for (let b = a + 1; b < neigh.length; b++) {
        let j = neigh[a];
        let k = neigh[b];
        if (i < j && j < k && adjacency[j].has(k)) {
          // compute wrapped vertex positions relative to i
          let pi = particles[i];
          let pj = particles[j];
          let pk = particles[k];
          let vx1 = pi.pos.x;
          let vy1 = pi.pos.y;
          let dx2 = pj.pos.x - pi.pos.x;
          if (abs(dx2) > width / 2) dx2 += dx2 > 0 ? -width : width;
          let dy2 = pj.pos.y - pi.pos.y;
          if (abs(dy2) > height / 2) dy2 += dy2 > 0 ? -height : height;
          let vx2 = vx1 + dx2;
          let vy2 = vy1 + dy2;
          let dx3 = pk.pos.x - pi.pos.x;
          if (abs(dx3) > width / 2) dx3 += dx3 > 0 ? -width : width;
          let dy3 = pk.pos.y - pi.pos.y;
          if (abs(dy3) > height / 2) dy3 += dy3 > 0 ? -height : height;
          let vx3 = vx1 + dx3;
          let vy3 = vy1 + dy3;
          let col = palette[(i + j + k) % palette.length];
          fill(col);
          beginShape();
          vertex(vx1, vy1);
          vertex(vx2, vy2);
          vertex(vx3, vy3);
          endShape(CLOSE);
        }
      }
    }
  }

  // draw edges on top (wrapped)
  stroke(0);
  strokeWeight(1);
  for (let e = 0; e < edges.length; e++) {
    let i = edges[e][0];
    let j = edges[e][1];
    let pi = particles[i];
    let pj = particles[j];
    let dx = pj.pos.x - pi.pos.x;
    if (abs(dx) > width / 2) dx += dx > 0 ? -width : width;
    let dy = pj.pos.y - pi.pos.y;
    if (abs(dy) > height / 2) dy += dy > 0 ? -height : height;
    line(pi.pos.x, pi.pos.y, pi.pos.x + dx, pi.pos.y + dy);
  }
  for (let particle of particles) {
    particle.follow(vectors);
    particle.update();
    particle.edges();
    particle.show();
  }
  start += sStartInc.value();
  // noStroke();
  // textSize(80);
  // strokeWeight(1);
  // fill("#d20a11");
  // text("UoS", width / 4 - 190, 100);
  // text("Creative", width / 4 - 190, 170);
  // text("Computing", width / 4 - 190, 240);
}
