let gridSize = 100;
let minusCounter = -250;
let positiveCounter = 200;
let distort;

let mic, fft;
let spectrum, snare, mids, bass, level;

// designed with Tom VR - Acheless from 2:20

function setup() {


  mic = new p5.AudioIn();
  mic.start(); // picks up your Mac’s selected input
  fft = new p5.FFT();
  fft.setInput(mic);
  amplitude = new p5.Amplitude();
  amplitude.setInput(mic);
  
  createCanvas(windowWidth, windowHeight, WEBGL);
  smooth(8);
  frameRate();
  strokeJoin(MITER);
  strokeCap(ROUND)
  //     distort = createWarp(({ glsl, millis, position }) => {
  //   const t = millis.div(1000)
  //   return glsl.vec3(
  //     t.mult(2).add(position.y().mult(4)).sin().mult(0.15),
  //     t.mult(0.5).add(position.z().mult(2)).sin().mult(0.15),
  //     t.mult(1.5).add(position.x().mult(3)).sin().mult(0.15)
  //   )
  // })
  
}

function draw() {

 
  background("grey");
  scale(0.4)
spectrum = fft.analyze();
  bass   = fft.getEnergy("bass");   // 20–140 Hz
  mids    = fft.getEnergy("mid");    // 400–2,600 Hz
  snare = fft.getEnergy("treble"); // snare

  let bassShift = map(bass, 0, 255, 20, 100);
  let midShift = map(mids, 0, 255, 10, 80);
  let snareShift = map(snare, 0,255,0,100)

   level = amplitude.getLevel(); //* 50; 


  // distort();
  strokeWeight(1);
  stroke("grey");

  translate(0, 0);
  orbitControl();

  function cameraPos() {
    let cameraPosX = 200 * cos(frameCount * 0.003);
    let cameraPosY = 200 * cos(frameCount * 0.003);
    let cameraPosZ = 200 * cos(frameCount * 0.003);

    camera(cameraPosX, cameraPosY, cameraPosZ);
  }

  cameraPos();

  for (let x = minusCounter; x < 500; x += gridSize) {
    for (let y = minusCounter; y < 250; y += gridSize) {
      for (let z = minusCounter; z < 500; z += gridSize) {
        // range from 250/200 to 550/500

        push();
        translate(x, y, z);
        stroke("grey")
        strokeWeight(snareShift)
        fill("black");
                box(x, y, z);
push();
fill("black");
box(x - 10, y - 10, z - 10)
// box(x- 500, y - 500, z - 500)
pop();

               push();
   
        // fill("grey");
        stroke("black")
        box(x / 1.1, y / 1.1, z / 1.1);
        pop();
        push();


        // if (x > 100, y > 100, z > 100)
        fill("deeppink");
        box(x / 2, y / 2, z / 2);
        pop();
        push();
        fill("blue");
        box(x / 2.5, y / 2.5, z / 2.5);
        pop();
        push();
        pop();
        pop();
      }
    }
  }
  push();
  fill("deeppink");
  // stroke("grey")
  sphere(bassShift * 2);
  pop();
  push();
  fill(50);
  noStroke();
  // sphere(3500 / bassShift);
  pop();

  // saveCanvas()
}

