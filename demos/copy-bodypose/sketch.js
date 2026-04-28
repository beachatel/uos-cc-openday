let video;
let bodyPose;

let poses = [];
let prevKeypoints = [];
let connections;

let sx = 1;
let sy = 1;

let samplesPerLimb = 1; // increase for more detail (8–20 is good)

let gridCols = 1;
let gridRows = 1;

let movementThreshold = 14;

function preload() {
  bodyPose = ml5.bodyPose();
}

function setup() {
  createCanvas(1080, 1920);
  imageMode(CENTER);
  frameRate(60);
  noStroke();

  video = createVideo(
    "https://res.cloudinary.com/dry9agskc/video/upload/v1777367415/dance4_yhypeu.mp4",
    () => {
      sx = width / video.width;
      sy = height / video.height;
    },
  );
  video.loop();
  video.volume(0);
  video.hide();

  bodyPose.ready.then(() => {
    bodyPose.detectStart(video, gotPoses, {
      maxDetections: 10,
      scoreThreshold: 0.1,
    });
    connections = bodyPose.getSkeleton();
  });
}

function draw() {
  background(0);
  scale(0.5);
  translate(width / 2, height / 2);

  samplesPerLimb = floor(map(sin(frameCount * 0.01), -1, 1, 4, 16));

  drawTopVideo();
  drawBottomGrid();
  // redGrid()
}

function drawTopVideo() {
  push();
  translate(width / 2, height / 6);
  image(video, 0, 0, width, height / 3);

  if (poses.length && connections) {
    stroke(255, 0, 0);
    strokeWeight(2);

    for (let pose of poses) {
      for (let [a, b] of connections) {
        let A = pose.keypoints[a];
        let B = pose.keypoints[b];
        if (A.confidence > 0.1 && B.confidence > 0.1) {
          let ax = (A.x - video.width / 2) * sx;
          let ay = ((A.y - video.height / 2) * sy) / 2;
          let bx = (B.x - video.width / 2) * sx;
          let by = ((B.y - video.height / 2) * sy) / 2;
          line(ax, ay, bx, by);
        }
      }
    }
  }
  pop();
}

function drawBottomGrid() {
  let gridW = width / gridCols;
  let gridH = height / 2 / gridRows;

  pop();
  fill(0);

  rect(0, height / 2, width, height / 2);

  if (poses.length < 2 || !connections) return;

  for (let i = 0; i < poses.length; i++) {
    let target = poses[i];
    let source = poses[(i + 1) % poses.length];

    let col = i % gridCols;
    let row = floor(i / gridCols) % gridRows;

    let cellX = col * gridW;
    let cellY = height / 2 + row * gridH;

    push();
    translate(cellX + gridW / 2, cellY + gridH / 2);

    for (let [a, b] of connections) {
      let tA = target.keypoints[a];
      let tB = target.keypoints[b];
      let sA = source.keypoints[a];
      let sB = source.keypoints[b];

      if (
        tA.confidence > 0.1 &&
        tB.confidence > 0.1 &&
        sA.confidence > 0.1 &&
        sB.confidence > 0.1
      ) {
        for (let s = 0; s <= samplesPerLimb; s++) {
          let t = s / samplesPerLimb;

          let tx = map(
            lerp(tA.x, tB.x, t),
            0,
            video.width,
            -gridW / 2,
            gridW / 2,
          );
          let ty = map(
            lerp(tA.y, tB.y, t),
            0,
            video.height,
            -gridH / 2,
            gridH / 2,
          );

          let sxSrc = lerp(sA.x, sB.x, t);
          let sySrc = lerp(sA.y, sB.y, t);

          push();
          translate(tx, ty);
          copy(video, sxSrc - 18, sySrc - 18, 36, 36, -24, -36, 48, 72);
          pop();
        }
      }
    }
    pop();
  }
}

function redGrid() {
  let base = 30;

  push();
  blendMode(EXCLUSION);
  noStroke();

  for (let x = 0; x < width; x += base) {
    for (let y = height / 2; y < height; y += base) {
      // sinusoidal subdivision
      let sx = map(sin(x * 2), -1, 1, 0.4, 1.2);
      let sy = map(cos(y * 2), -1, 1, 0.4, 1.2);

      let w = base * sx;
      let h = base * sy;

      let alpha = map(sin(x * 0.01 + y * 0.01), -1, 1, 80, 180);

      fill(210, 0, 20, 255);

      rect(x + (base - w) * 0.5, y + (base - h) * 0.5, w, h);
    }
  }

  pop();
}

function gotPoses(results) {
  if (poses.length > 0) {
    prevKeypoints = poses.map((p) =>
      p.keypoints.map((k) => ({ x: k.x, y: k.y })),
    );
  }
  poses = results;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  if (video && video.width) {
    sx = width / video.width;
    sy = height / video.height;
  }
}
