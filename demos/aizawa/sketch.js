let params = {
  DiscreteTime: 0.01,
  PointLength: 10000,
  PointSize: 10,
  a: 0.95,
  b: 0.7,
  c: 0.6,
  d: 3.5,
  e: 0.25,
  f: 0.1,
  ShowAxis: true,
};

let angle = 0; // Intialising angle as 0
let cam, font; // Declaring camera and font object
let points = []; // Array to store the points of the attractor
let x = 0.1,
  y = 1,
  z = 0.01; // Initial conditions
let a, b, c, d, e, f; // Aizawa parameters

function setup() {
  createCanvas(window.innerWidth, window.innerHeight, WEBGL);
  cam = createCamera();
  cam.setPosition(-500, -3000, 1000);
  cam.lookAt(0, 0, 0);

  setupGUI();
}

function draw() {
  background(0, 0, 255);
  document.addEventListener("gesturestart", function (e) {
    e.preventDefault();
  });

  orbitControl(); //3D camera control with mouse

  // Axis guidelines
  if (params.ShowAxis == true) {
    strokeWeight(10); // Changes stroke weight of axis guidelines

    stroke(255, 0, 0); // Red for X-axis
    line(-5000, 0, 0, 5000, 0, 0); // X-axis

    stroke(0, 255, 0); // Green for Y-axis
    line(0, -5000, 0, 0, 5000, 0); // Y-axis

    stroke(255, 255, 0); // Yellow for Z-axis
    line(0, 0, -5000, 0, 0, 5000); // Z-axis
  }

  // let dt = 0.01; // Time step

  noStroke(); // Removes stroke from spheres
  fill(255, 100, 200); // Sphere fill colour

  // Aizawa equations
  let dx = (z - params.b) * x - params.d * y;
  let dy = params.d * x + (z - params.b) * y;
  let dz =
    params.c +
    params.a * z -
    z ** 3 / 3 -
    (x ** 2 + y ** 2) * (1 + params.e * z) +
    params.f * z * x ** 3;

  x += dx * params.DiscreteTime; // x += discrete x * discrete time
  y += dy * params.DiscreteTime; // y += discrete y * discrete time
  z += dz * params.DiscreteTime; // z += discrete z * discrete time

  // Scale the point for better visualization and add it to the array
  points.push(createVector(x * 1000, y * 1000, z * 1000));

  // Limit the number of points to avoid performance issues
  if (points.length > params.PointLength) {
    points.shift();
  }

  // Draw the Aizawa attractor points
  for (let p of points) {
    push();
    translate(p.x, p.y, p.z);
    sphere(params.PointSize); // Small spheres for each point
    pop();
  }
}

function windowResized() {
  resizeCanvas(window.innerWidth, window.innerHeight);
  pane.refresh();
}

function setupGUI() {
  const pane = new Pane({
    title: "Parameters",
  });
  pane.element.classList.add("my-pane");

  pane.addBlade({ view: "separator" });
  pane.addBinding(params, "DiscreteTime", {
    min: 0.001,
    max: 0.05,
    step: 0.01,
  });
  pane.addBinding(params, "PointSize", { min: 1, max: 40, step: 0.1 });
  pane.addBinding(params, "PointLength", { min: 100, max: 50000, step: 10 });
  pane.addBlade({ view: "separator" });
  pane.addBinding(params, "a", { min: 0.5, max: 1.5, step: 0.01 });
  pane.addBinding(params, "b", { min: 0.5, max: 1, step: 0.01 });
  pane.addBinding(params, "c", { min: 0.5, max: 1, step: 0.01 });
  pane.addBinding(params, "d", { min: 2, max: 5, step: 0.1 });
  pane.addBinding(params, "e", { min: 0.1, max: 0.5, step: 0.01 });
  pane.addBinding(params, "f", { min: 0.05, max: 0.2, step: 0.01 });

  pane.addBlade({ view: "separator" });

  let cc = pane.addButton({
    title: "Clear Canvas",
  });
  cc.on("click", function () {
    points = []; // Clear the points array
    x = 0.1; // Reset initial conditions
    y = 1;
    z = 0.01;
  });

  pane.addBlade({ view: "separator" });

  pane.addBinding(params, "ShowAxis");
}
