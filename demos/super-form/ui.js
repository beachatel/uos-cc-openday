let value = 0.25;
let interA;
let x1 = 10;
let v1, v2, v3, v4;
let from, to;
let noiseFrom, noiseTo;
let r1, r2, r3, r4;
let r;
let pane;

let params = {
  Translate: 10,
  GridSize: 50,
  GridMult: 2,
  Tan: true,
  Sin: false,
  TanEllipseAnimation: false,
  SinEllipseAnimation: false,
  DisplayRectangles: false,
  AffectRectanglePosSin: false,
  BackgroundColour: "#000000",
  ColourPallete: "#FFFFFF",
  ColourPallete1: "#FFFFFF",
  ColourPallete2: "#FFFFFF",
  preset: "",
};

let colorInputs = [];

function setup() {
  createCanvas(windowWidth, windowHeight);
  setupGUI();

  r = random(1);
}

function draw() {
  pane.refresh(); // update the information in the GUI

  // let params.GridSize = params.GridSizeSlider.value();
  // let s2 = params.GridSizeMultSlider.value();

  let baseNoise = frameCount * 0.0002;
  r1 = map(noise(baseNoise), 0, 100, 0.3, 0.9);

  let nOffset = 0.1;

  // Declare interpolation variables here
  let interA, interB, interC, interD;

  // Set up noise-based from/to colors; the last iteration will set final values
  let nVal = baseNoise;
  let fromIndex = floor(noise(nVal));
  let toIndex = floor(noise(nVal + 10));
  let from = params.ColourPallete;
  let to = params.ColourPallete1;

  //tan animation var
  let e1 = 1;
  e1 -= 0.5;

  //sin animation var
  let e2 = 1;
  e2 -= v2 * 2;

  v1 = abs(sin(frameCount * 0.01));
  v2 = abs(sin(frameCount * 0.02));
  v3 = abs(sin(frameCount * 0.03));
  v4 = abs(sin(frameCount * 0.04));
  v5 = abs(sin(frameCount * 0.05));

  // interA = lerpColor(from, to, v1);
  // interB = lerpColor(from, to, v2);
  // interC = lerpColor(from, to, v4);
  // interD = lerpColor(from, to, v5);

  noStroke();
  // background("#140208");
  background(params.BackgroundColour);
  rectMode(CENTER);
  ellipseMode(CENTER);

  for (let x = 0; x < width; x += params.GridSize * params.GridMult) {
    for (let y = 0; y < height; y += params.GridSize * params.GridMult) {
      push();

      translate(x / params.Translate, y / params.Translate);

      stroke(interC);
      strokeWeight((r1 * params.GridSize) / 4);
      fill(255, 0, 0);

      if (params.DisplayRectangles == true) {
        rect(x, y, params.GridSize * r1, params.GridSize * r1);
      }

      if (params.AffectRectanglePosSin == true) {
        // effect rectangles with sin
        rect(
          x / sin(2),
          y / sin(2),
          params.GridSize * r1,
          params.GridSize * r1,
        );
      }

      noStroke();
      fill(params.ColourPallete);

      if (params.Tan == true) {
        ellipse(
          x * tan(1),
          y * tan(1),
          params.GridSize * tan(1),
          params.GridSize * tan(1),
        );
      }

      if (params.Sin == true) {
        ellipse(x, y, params.GridSize * sin(1), params.GridSize * sin(1));
      }

      // animate circles checkbox

      if (params.TanEllipseAnimation == true) {
        ellipse(
          x,
          y,
          params.GridSize * tan(1) * e1,
          params.GridSize * tan(1) * e1,
        );
      }

      if (params.SinEllipseAnimation == true) {
        ellipse(
          x,
          y,
          params.GridSize * sin(1) * e2,
          params.GridSize * sin(1) * e2,
        );
      }
      //  ellipse(x * sin (2), y * sin(2), params.params.GridSize, params.params.GridSize);

      // ellipse(x * tan(1), y * tan(1), params.params.GridSize, params.params.GridSize);

      //  boolean checkbox to include this

      // if (r < 0.25 && x < width / 2) {
      //   ellipse(
      //     x * sin(2),
      //     y / sin(2),
      //     params.params.GridSize,
      //     params.params.GridSize,
      //   );
      // } else if (r < 0.5 && x > width / 2) {
      //   ellipse(
      //     x / sin(2),
      //     y * sin(2),
      //     params.params.GridSize,
      //     params.params.GridSize,
      //   );
      // } else if (r < 0.75 && y < height / 2) {
      //   ellipse(
      //     x / sin(2),
      //     y * sin(2),
      //     params.params.GridSize,
      //     params.params.GridSize,
      //   );
      // } else if (r < 1 && y > height / 2) {
      //   ellipse(
      //     x / sin(2),
      //     y * sin(2),
      //     params.params.GridSize,
      //     params.params.GridSize,
      //   );
      // }

      // check boxes

      fill(interC);
      //  ellipse(x * sin (2), y * sin(2), params.params.GridSize / 2.5, params.params.GridSize / 2.5);

      stroke(interD);
      strokeWeight(2);
      // line(x, y * 2, x, y, x, y);
      // line(x, y, x * 2, y, x, y);

      pop();
    }
  }
}
function saveImage() {
  save("image.png");
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function setupGUI() {
  pane = new Pane();

  console.log(pane);
  pane.addBlade({ view: "separator" });
  pane.addBinding(params, "Translate", { min: 1, max: 20, step: 0.01 });
  pane.addBinding(params, "GridSize", {
    min: 10,
    max: 100,
    step: 1,
  });
  pane.addBinding(params, "GridMult", { min: 1, max: 4, step: 0.1 });
  pane.addBlade({ view: "separator" });
  pane.addBinding(params, "Tan");
  pane.addBinding(params, "Sin");
  pane.addBinding(params, "TanEllipseAnimation");
  pane.addBinding(params, "SinEllipseAnimation");
  pane.addBinding(params, "DisplayRectangles");
  pane.addBinding(params, "AffectRectanglePosSin");

  pane.addBlade({ view: "separator" });

  pane.addBinding(params, "BackgroundColour");
  pane.addBinding(params, "ColourPallete");
  pane.addBinding(params, "ColourPallete1");
  pane.addBinding(params, "ColourPallete2");
  pane.addBlade({ view: "separator" });

  // adding a button
  let button = pane.addButton({
    title: "ExportImage",
    label: "", // optional
  });
  button.on("click", function saveImage() {
    save("image.png");
  });

  pane.addBlade({ view: "separator" });

  pane.addBinding(params, "preset", {
    options: {
      None: "",
      Preset1: "Preset 1",
      Preset2: "Preset 2",
      Preset3: "Preset 3",
    },
  });
}
