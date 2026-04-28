let cx, cy;

// noise
let start = 1.1;
let inc = 0.02;
let zoff = 2;

// buffer
let pg;

// ascii
let resolution = 10;
let chars = "@#W$9876543210?!abc;:+=-,._";
let mono;


function preload() {
  mono = loadFont("CourierN.ttf"); // ensure font exists
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
angleMode(RADIANS)
  cx = width / 2;
  cy = height / 2;

  pg = createGraphics(width, height);
  pg.rectMode(CENTER);
  pg.noStroke();

  textFont(mono);
  textSize(resolution);
  textAlign(CENTER, CENTER);

  frameRate(5);
  smooth(8);
}

function draw() {
    scale(0.5);
  // background(200,55,100);
  background(100);



  pg.background(0);

  let xoff = start;

  for (let x = 0; x < width; x += resolution) {
    let yoff = start;

    for (let y = 0; y < height; y += resolution) {
          for (let z = 0; z < width/height; z += resolution) {
      let n = noise(xoff * 20, yoff, zoff);
      let val = map(n, 0, 1, 0, 255);

      

    pg.fill(val,val,val);
      pg.rect(x, y, resolution, resolution);

 



      yoff += inc;
    }
    xoff += inc;
  }
           
  }


  // ---------- ASCIIFY ----------
  pg.loadPixels();

  push();
  resetMatrix();                 // IMPORTANT for WEBGL
  translate(-width / 2, -height / 2);

  fill(255,255,255);
  noStroke();
  textFont(mono);
  textSize(resolution);

  for (let y = 0; y < height; y += resolution) {
    for (let x = 0; x < width; x += resolution) {
          for (let z = 0; z < width / height * 2; z += resolution) {

      let idx = 4 * (y * width + x);
      let bright = pg.pixels[idx];

      let charIndex = int(
        map(bright, 0, 255, chars.length - 1, 0)
      );

      let ch = chars.charAt(charIndex);
 
    

      text(ch, x, y);
    //   push();
    //  translate(width/2,height/2);
    //  scale(0.5);
    //   noFill();
    //   //  stroke("blue")
    //   //  strokeWeight(5);
    //     fill(x / 10,y / 10,z * 10)
    //      box(x,y,z)
    //       pop();
   orbitControl();

    }
  }
}

  pop();

 
  zoff += 0.02;
  start += 0.01;




}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  pg = createGraphics(width, height);
}
