let gridSize = 100;
let minusCounter = -250;
let positiveCounter = 200;

function setup() {
  createCanvas(windowWidth, windowHeight,WEBGL);
  smooth(8);
  frameRate();
    strokeJoin(MITER);
}

function draw() {
  scale(0.4);
  background("black");
  strokeWeight(1.5);
      stroke("#ff00b7ff");

  translate(0,0);
  orbitControl();
  let cameraPosX = 400 * cos(frameCount * 0.001);
    let cameraPosY = 400 * cos(frameCount * 0.001);
      let cameraPosZ = 400 * cos(frameCount * 0.001);
  camera(cameraPosX, cameraPosY, cameraPosZ);

  for(  let x = minusCounter; x < 500; x+= gridSize){
    for(let y = minusCounter; y < 200; y += gridSize){
      for(let z = minusCounter; z < 500; z += gridSize){
        
// range from 250/200 to 550/500
  
      push();
      translate(x,y,z);
      fill("#ff9500ff");
      sphere(x,y,0);
      box(x,y,z);
    
      push();
      fill("purple")
         box(x/1.1,y/1.1,z/1.1);
         pop();
         push();
         fill("blue")
           box(x/2,y/2,z/2);
           pop();
      
      pop();
    }
  }
      }
      fill(0,255,0)
        sphere(50);
              sphere(150);
               sphere(200);
push();
fill("black")
noStroke();
  sphere(3500);
  pop();
}
