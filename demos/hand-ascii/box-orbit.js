let cx, cy;
let diam = 500;
let gridSize = 100;
  let idxVal = 20;
  let nc;

// noise
let start = 10;
let inc = 0.07;
let inc2 = 0.3;
let zoff = 0;

// buffer
let pg;

// ascii
let resolution = 20;
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
  rectMode(CENTER);
  textAlign(CENTER)
  pg.noStroke();
  textFont(mono);
  textSize(20);

smooth(8)
frameRate(10);


  


}


function draw() {

  background(200,100,200,100);
  pg.background(0,100,20)
  // clear();
  fill(255,90,20);

    // rect(-width,-height,2000,2000);


    // blendMode(DODGE);
    // pg.blendMode(ADD);
  // scale(0.7);
  translate(-width / 2, -width / 2);


    // build ASCII lookup
  for (let i = 0; i < 256; i++) {
    let idx = int(map(i, 0, idxVal, 0, 20));
    ascii[i] = chars.charAt(idx);
  }



  idxVal += 0.1;

  if (idxVal > 80){
    idxVal = 20;
  }


  // rect(0,0,1000,1000)
  diam += 1;
  

  if (diam > 2500){
    diam = 10;
  }





  let xoff = start;

  for (let x = 0; x < width; x += resolution) {
    
           let yoff = start + 100;
    for (let y = 0; y < height; y += resolution) {
 
      let cell = createVector(x, y);
      let centre = createVector(cx, cy);
      let dist = p5.Vector.sub(cell, centre).mag();

      nc = map(noise(xoff, yoff, zoff), 0, 1, 0, 255);
      let nc1 = map(noise(xoff, yoff, zoff), 0, 1, 0, 255);

      // if (dist < diam) {
      //   pg.fill(nc);
      // } else {
      //   pg.fill(nc1);
      // }
  pg.fill(nc * sin(1))

      pg.ellipse(x / 2, y / 2, 50, 50);
     
    

      yoff += inc * sin(2);
    }
    xoff += inc;
  }

  // zoff += inc2 * 3;
  // start += inc2 * 3;

  // // ASCIIFY
  pg.loadPixels();

  pg.fill(10, 100, 100);


  // push();
  // noStroke();  
  // fill(10,200,200,100)
  //   box(width,height,20000)

  //   box(width*2,height,200,)
  //   pop();

  for (let x = 0; x < width; x += resolution ) {
    for (let y = 0; y < height; y += resolution * 2) {
      for(let z = 0; z < height /20; z += resolution){
      let idx = 4 * (x * y / 2);
      let bright = pg.pixels[idx];
      let ch = ascii[bright];
        orbitControl();
      textSize(50);
      text(ch, x, y);
      push();
        translate(width/2,height/2);
        noFill();
        stroke("blue")
        strokeWeight(0.5);
        fill(x,y,z)
      box(x,y,z)
      pop();
    }
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
