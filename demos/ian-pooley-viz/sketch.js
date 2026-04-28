

// let sound;
let fft;
let amplitude;
let mic;


let s1;       
let gridSize;   
let s2;         
let doTan = false;
let doTanEllipse = false;
let doSin = false;
let doSinEllipse = false;
let doCheck1 = false, doCheck2 = false, doCheck3 = false, doCheck4 = false;
let doRect = true;
let doRectSin = false;
let soundFrameRate;
let dgs,dgsX,dgsY; //dynamic gridsize for x and y
let dw,dh; //dynamic width and height in grid for loop

let r1;
let v1, v2, v3, v4, v5;
let r;


let t = 0;

// function preload() {

//   // sound = loadSound("Data/enlite.mp3");
// }
  
  function setup() {
  createCanvas(windowWidth, windowHeight);

   mic = new p5.AudioIn();
  mic.start(); // picks up your Mac’s selected input
  fft = new p5.FFT();
  fft.setInput(mic);
  amplitude = new p5.Amplitude();
  amplitude.setInput(mic);
  
  // sound.loop();


  r = random(1);
    // Request screen wake lock to prevent sleep
  requestWakeLock();
}

function draw() {

frameRate(soundFrameRate);

let palette = [
  "#e53723",
  "#3d85d8",
  "#e66e95",
  "#3c8253",
  "#e58136"
];


  colorMode(HSB, 255);
  t += 0.005 ;
  let hueVal = map(noise(t), 0, 1, 0, 255);
  background(hueVal, 255, 255);


  colorMode(RGB, 255);


  let spectrum = fft.analyze();
  let bassEnergy   = fft.getEnergy("bass","100");   // 20–140 Hz
  let midEnergy    = fft.getEnergy("mid");    // 400–2,600 Hz
  let snare = fft.getEnergy("treble","4000"); // snare

  amplitude.smooth(0);   // 0 disables smoothing for sharper spikes
let level = amplitude.getLevel(); //* 50;  // multiply for a stronger effect    // overall amplitude (0..1-ish)

// console.log(bassEnergy);
  s1       = map(midEnergy,   0, 255,  1,8);
  gridSize = map(bassEnergy,    0, 255, 5, 20);
  s2       = map(snare, 0, 255,  1,   5);
  mids = map(midEnergy,0,255,10,100);
  snare = map(snare,0,255,1,50);
  soundFrameRate = map(level,0,1,10,40)

// console.log(soundFrameRate);

  doTan         = (bassEnergy > 50);
  doSin         = (mids > 15);
  doTanEllipse  = (level > 0.1);
  doSinEllipse  = (level < 0.1);
  doCheck1      = (snare > 5);
  doCheck2      = (snare < 1.2);
   doCheck3     = (bassEnergy > 5);
// console.log(snare);
  //   dgs = gridSize * s2;

  // dgs = gridSize;

 if (level < 0.1){
  dgsX = 70;
 } else if (level > 0.5){
 dgsX = gridSize * s2;
  }

  if (level > 0.1){
 dgsY = 30
  } else if (level < 0.1){
    dgsY = gridSize * s2;
  }

   if (level > 0.1){
  dw = width/level;
 } else if (level < 0.5){
 dw= width;
  }

//   if (level > 0.5){
//  dh = height;
//   } else if (level < 0.5){
//     dh = height/2;
//   }
dh = height;


 

  // doCheck3     = (snare > 100);
  // doCheck4     = (snare > 100);


  //rect size
  let baseNoise = frameCount * 0.005; 
  r1 = map(noise(baseNoise), 0, 1, 0.3, 1);


  v1 = abs(sin(frameCount * 0.005));
  v2 = abs(sin(frameCount * 0.01));
  v3 = abs(sin(frameCount * 0.015));
  v4 = abs(sin(frameCount * 0.02));
  v5 = abs(sin(frameCount * 0.025));


  let fromIndex = floor(noise(baseNoise) * palette.length);
  let toIndex   = floor(noise(baseNoise + 1000) * palette.length);
  let fromColor = color(palette[fromIndex]);
  let toColor   = color(palette[toIndex]);

  let interA = lerpColor(fromColor, toColor, v1);
  let interB = lerpColor(fromColor, toColor, v2);
  let interC = lerpColor(fromColor, toColor, v4);
  let interD = lerpColor(fromColor, toColor, v5);

  // mappedBassEnergy = map(bassEnergy,20,140,20,50);
  // let lerpedBass = (min(bassEnergy), max(bassEnergy), 0.1  );

  //   trebleEnergy = map(0,255,10,100);
  // let lerpedTreble = (min(bassEnergy), max(bassEnergy), 0.1  );

  rectMode(CENTER);
  ellipseMode(CENTER);


  for (let x = 0; x < dw; x += dgsX) { //dynamic gridsize update
    for (let y = 0; y < dh; y += dgsY) {
   

  
      push();
   
      translate(x / s1, y / s1);
   
      stroke(interC);
      strokeWeight(r1 * gridSize / 4);
      fill(interD);

      let r3 = bassEnergy / 200; 

      if (doRect) {
        rect(x, y, gridSize * r3, gridSize * r3);
      }
      if (doRectSin) {
  
        rect(x / sin(2), y / sin(2), gridSize * r3, gridSize * r3);

      }

      noStroke();
      fill(interB);

      if (doTan) {
        ellipse(x * tan(1), y * tan(1), gridSize * tan(1) * r3, gridSize * tan(1) * r3);
      }
      if (doSin) {
        ellipse(x, y, gridSize * sin(1), gridSize * sin(1));
      }

      // Animate circles if triggered
      if (doTanEllipse) {
        let e1 = 1 - (level * 2.0);
        ellipse(x, y, gridSize * tan(1) * e1, gridSize * tan(1) * e1);
      }
      if (doSinEllipse) {
        let e2 = 1 - (level * 5.0);
        ellipse(x, y, gridSize * sin(1) * e2, gridSize * sin(1) * e2);
      }

  
      if (doCheck1) {
        if(level < 0.2){
    ellipse(x * sin(2), y / sin(2), gridSize * bassEnergy / 2, gridSize);
        } else if(level > 0.2 ){
         
           ellipse(x * sin(2), y / sin(2), gridSize, gridSize * bassEnergy / 2);
        }
      
      } else if (doCheck2) {
        
 ellipse(x / sin(2), y * sin(2), gridSize * midEnergy / 50, gridSize * midEnergy / 50);
        
       

      } else if (doCheck3) {
        ellipse(x / sin(2), y * sin(2), gridSize / 50, gridSize / 50);
      } else if (doCheck4) {
        ellipse(x / sin(2), y * sin(2), gridSize, gridSize);
      }

      pop();
    }
  }
}


