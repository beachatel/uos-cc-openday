let model3D;
let program;
let renderer;
let video;
let handPose, hands = [];
let camRotX = 0;
let camRotY = 0;

let targetRotX = 0;
let targetRotY = 0;

let targetRadius = 600; // Default distance
let currentRadius = 600;


let vertices = [];
let colors = [];
let randoms = [];

let ready = false;
let dissolve = 0; // smoothed dissolve value

function setup() {
  renderer = createCanvas(windowWidth, windowHeight, WEBGL);

  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  handPose = ml5.handPose(video, () => {
    handPose.detectStart(video, results => {
      hands = results;
    });
  });

  loadModel("radial.stl", true, m => {
    model3D = m;
    const gl = drawingContext;

    // ===== VERTEX SHADER =====
    const vert = `
    attribute vec3 aPosition;
    attribute vec3 aColor;
    attribute vec3 aRandom;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    uniform float uTime;
    uniform float uProgress;

    varying vec3 vColor;

    void main() {
      vec3 pos = aPosition;

      if (uProgress > 0.0) {
        pos.y -= uProgress * 100.0;
        pos += aRandom * uProgress * 100.0;
        pos.x += sin(uTime + pos.y * 0.1) * (uProgress * 20.0);
      }

      gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(pos, 1.0);
      gl_PointSize = 1.5;
      vColor = aColor;
    }
    `;

    // ===== FRAGMENT SHADER =====
    const frag = `
    precision highp float;
    varying vec3 vColor;

    void main() {
      vec2 c = gl_PointCoord - 0.5;
      if (length(c) > 0.3) discard;
      gl_FragColor = vec4(vColor, 1.0);
    }
    `;

    program = createProgramFromSource(gl, vert, frag);
    gl.useProgram(program);

    program.aPosition = gl.getAttribLocation(program, "aPosition");
    program.aColor = gl.getAttribLocation(program, "aColor");
    program.aRandom = gl.getAttribLocation(program, "aRandom");
    program.uModelViewMatrix = gl.getUniformLocation(program, "uModelViewMatrix");
    program.uProjectionMatrix = gl.getUniformLocation(program, "uProjectionMatrix");
    program.uTime = gl.getUniformLocation(program, "uTime");
    program.uProgress = gl.getUniformLocation(program, "uProgress");

    // ===== PROCESS MODEL =====
    let yMin = Infinity, yMax = -Infinity;
    for (const v of model3D.vertices) {
      yMin = min(yMin, v.y);
      yMax = max(yMax, v.y);
    }

    for (const v of model3D.vertices) {
      vertices.push(v.x, v.y, v.z);

      randoms.push(
        random(-1, 1),
        random(-1, 1),
        random(-1, 1)
      );

      const t = map(v.y, yMin, yMax, 0, 1);
      colors.push(
        lerp(0.2, 1.0, t),
        lerp(0.4, 0.8, t),
        lerp(1.0, 0.3, t)
      );
    }

    program.positionBuffer = createVBO(gl, vertices);
    program.colorBuffer = createVBO(gl, colors);
    program.randomBuffer = createVBO(gl, randoms);

    ready = true;
  });
}

function draw() {
  if (!ready || !program) return;
  background(10);
  video.loadPixels();
  image(video,0,0,0,0);
  const gl = drawingContext;

  let targetDissolve = 0;

  if (hands.length > 0) {
    let hand = hands[0];
    let index = hand.keypoints.find(k => k.name === "index_finger_tip");
    let thumb = hand.keypoints.find(k => k.name === "thumb_tip");

    if (index && thumb) {
      // 1. ROTATION (Index Finger Position)
      let nx = map(index.x, video.width, 0, -PI * 1.2, PI * 1.2);
      let ny = map(index.y, 0, video.height, -PI * 0.4, PI * 0.4);
      targetRotY = nx;
      targetRotX = ny;

      // 2. PINCH ZOOM (Distance between Index and Thumb)
      // Calculate 2D distance between tips
      let d = dist(index.x, index.y, thumb.x, thumb.y);
      
      // Map distance: 
      // Small distance (pinched) = Zoomed Out (radius 1000)
      // Large distance (spread) = Zoomed In (radius 200)
      targetRadius = map(d, 20, 200, 1000, 150, true);

      // 3. DISSOLVE TRIGGER
      if (index.y < video.height * 0.2) targetDissolve = 1.0;
      if (isFistClosed(hand)) targetDissolve = 1.0;
    }
  }

  // 4. SMOOTHING EVERYTHING
  camRotX = lerp(camRotX, targetRotX, 0.15); 
  camRotY = lerp(camRotY, targetRotY, 0.15);
  currentRadius = lerp(currentRadius, targetRadius, 0.1); // Smooth zoom
  dissolve = lerp(dissolve, targetDissolve, 0.1);

  // 5. UPDATE CAMERA
  let camX = currentRadius * cos(camRotX) * sin(camRotY);
  let camY = currentRadius * sin(camRotX);
  let camZ = currentRadius * cos(camRotX) * cos(camRotY);

  camera(camX, camY, camZ, 0, 0, 0, 0, 1, 0);

  // 6. RENDER
  gl.useProgram(program);
  bindAttrib(gl, program.positionBuffer, program.aPosition, 3);
  bindAttrib(gl, program.colorBuffer, program.aColor, 3);
  bindAttrib(gl, program.randomBuffer, program.aRandom, 3);
  gl.uniformMatrix4fv(program.uModelViewMatrix, false, renderer.uMVMatrix.mat4);
  gl.uniformMatrix4fv(program.uProjectionMatrix, false, renderer.uPMatrix.mat4);
  gl.uniform1f(program.uTime, frameCount * 0.02);
  gl.uniform1f(program.uProgress, dissolve);
  gl.drawArrays(gl.POINTS, 0, vertices.length / 3);
}

// ===== HELPERS =====
function createVBO(gl, data) {
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
  return buf;
}
function isFistClosed(hand) {
  // We compare the finger tips to the wrist to see if they are "curled in"
  const wrist = hand.keypoints.find(k => k.name === "wrist");

  const tips = [
    "thumb_tip",
    "index_finger_tip",
    "middle_finger_tip",
    "ring_finger_tip",
    "pinky_tip"
  ].map(name => hand.keypoints.find(k => k.name === name));

  // If we can't find the points, assume no fist
  if (!wrist || tips.includes(undefined)) return false;

  let curledCount = 0;
  for (let tip of tips) {
    // Calculate 2D distance between wrist and each fingertip
    let d = dist(tip.x, tip.y, wrist.x, wrist.y);
    
    // If distance is small (less than 100 pixels), the finger is likely curled
    if (d < 100) curledCount++; 
  }

  // If 4 or more fingers are curled, it's a fist!
  return curledCount >= 4;
}

function bindAttrib(gl, buf, loc, size) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
}

function createProgramFromSource(gl, vsSource, fsSource) {
  const vs = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vs, vsSource);
  gl.compileShader(vs);

  const fs = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fs, fsSource);
  gl.compileShader(fs);

  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);

  return prog;
}
