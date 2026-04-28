let cx, cy;
let diam = 500;
let gridSize = 100;
  let idxVal = 20;

// noise
let start = 0;
let inc = 0.07;
let inc2 = 0.03;
let zoff = 1;

// buffer
let pg;

// ascii
let resolution = 10;
let ascii = [];
let chars = "@#W$9876543210?!abc;:+=-,._";

let mono;

function preload() {
  mono = loadFont("CourierN.ttf"); 
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);

  pg = createGraphics(width, height);
  pg.rectMode(CENTER);
  pg.noStroke();
  textFont(mono);
  textSize(20);




  


}


function draw() {
  orbitControl();
  background(50, 50, 100);
  fill(255,90,20);

    rect(-width,-height,2000,2000);


    blendMode(DODGE);
    // pg.blendMode(ADD);
  scale(0.7);
  translate(-width / 2, -width / 2);


    // build ASCII lookup
  for (let i = 0; i < 256; i++) {
    let idx = int(map(i, 0, idxVal, 0, 20));
    ascii[i] = chars.charAt(idx);
  }

  console.log(idxVal);

  idxVal += 0.5;

  if (idxVal > 80){
    idxVal = 20;
  }


  // rect(0,0,1000,1000)
  diam += 10;
  

  if (diam > 2500){
    diam = 10;
  }

  console.log(diam)

  pg.background(100, 100, 100);

  let xoff = start;

  for (let x = 0; x < width; x += resolution) {
    let yoff = start + 100;

    for (let y = 0; y < height; y += resolution) {
      let cell = createVector(x, y);
      let centre = createVector(cx, cy);
      let dist = p5.Vector.sub(cell, centre).mag();

      let nc = map(noise(xoff, yoff, zoff), 0, 1, 0, 120);
      let nc1 = map(noise(xoff, yoff / 2, zoff), 0, 1, 0, 155);

      // if (dist < diam) {
      //   pg.fill(nc);
      // } else {
      //   pg.fill(nc1);
      // }
  pg.fill(nc)

      pg.ellipse(x / 2, y / 2, resolution, resolution);
    

      yoff += inc;
    }
    xoff += inc;
  }

  zoff += inc2 * 3;
  start += inc2 * 3;

  // // ASCIIFY
  pg.loadPixels();

  fill(10, 100, 244);

  for (let y = 0; y < height; y += resolution) {
    for (let x = 0; x < width; x += resolution) {
      let idx = 4 * (x * width + y);
      let bright = pg.pixels[idx];
      let ch = ascii[bright];

      text(ch, x, y);
    }
  }

  // } else if (r < 0.5){
  //    for (let y = 0; y < height; y += resolution / 2) {
  //   for (let x = 0; x < width; x += resolution) {
  //     let idx = 4 * (x * width + y);
  //     let bright = pg.pixels[idx];
  //     let ch = ascii[bright];
  //     fill(255,0,255)
  //     text(ch, x, y);
  //   }
  // }
  // }
}
