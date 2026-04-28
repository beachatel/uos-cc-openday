let resolution = 7; 
const chars = "P@#W$?!;:. "; 
let video, handPose, hands = [];

// Physics
let smoothX = 0.5, smoothY = 10, smoothZoom = 1;
let velX = 0, velY = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  handPose = ml5.handPose(video, () => {
    handPose.detectStart(video, (results) => { hands = results; });
  });

  textFont('courier');
  textSize(resolution);
  textAlign(CENTER, CENTER);
}

function draw() {
  background(0);
       console.log(smoothY);

  // 1. DYNAMICS & PHYSICS
  if (hands.length > 0) {
    let hand = hands[0];
    let index = hand.index_finger_tip;
    let thumb = hand.thumb_tip;

    let tx = map(index.x, 0, video.width, 1, -1);
    let ty = map(index.y, 0, video.height, -1, 1);
    let d = dist(index.x, index.y, thumb.x, thumb.y);
    
    velX = (tx - smoothX) * 0.2;
    velY = (ty - smoothY) * 0.2;
    smoothX += velX;
    smoothY += velY;
    smoothZoom = lerp(smoothZoom, map(d, 20, 500, 0.1, 4.0, true), 0.1);
  }

  // 2. MAGMA RENDERER
  let time = frameCount * 0.015;
  let zoomLevel = 0.005 * (1 / smoothZoom);

  for (let y = 0; y < height; y += resolution) {
    for (let x = 0; x < width; x += resolution) {
      
      // Coordinate warping based on hand orbit
      let xOff = (x - width / 2) * zoomLevel;
      let yOff = (y - height / 2) * zoomLevel;
      
      let nx = xOff * cos(smoothX) - yOff * sin(smoothY);
      let ny = xOff * sin(smoothX) + yOff * cos(smoothY);
      
      // Layered noise for "viscosity"
      let n = noise(nx, ny, time);
      n = (n + noise(nx * smoothX, ny * smoothY, time * 0.5) * 0.5) / 1.5;

      // MAGMA COLOR GRADIENT
      let col;
      if (n < 0.25) {
        col = lerpColor(color("green"), color("orange"), n / 0.25); // Deep Crust
      } else if (n < 0.5) {
        col = lerpColor(color("purple"), color("mint"), (n * 0.3) / 0.5); // Molten Lava
      }  else if (n < 0.75) {
        col = lerpColor(color("pink"), color("deeppink"), (n * smoothZoom) / 0.75); // White Heat
      } else {
        col = lerpColor(color("green"), color("blue"), (n * smoothX) * 2);
      }
 
      // let hRes = map(smoothX,0,10,7,40)
      // resolution = hRes;
      // console.log(resolution)

      let charIdx = floor(map(n, 0, 1, chars.length - 1, 0));
      fill(col);
      noStroke();

      text(chars[charIdx], x, y);
      
    }
  }

  // 3. TOP PREVIEW & FINGERTIPS
  // drawUI();
}

function drawUI() {
  // push();
  // // Mirrored Video Preview
  //   translate(160,0)
  // scale(-1,1);

  // // image(video, 0, 0, 160, 120);

  // // Finger Points (Overlaying the video)
  // if (hands.length > 0) {
  //   let hand = hands[0];
  //   let tips = [hand.thumb_tip, hand.index_finger_tip, hand.middle_finger_tip, hand.ring_finger_tip, hand.pinky_finger_tip];
    
  //   tips.forEach(p => {
  //     if (p) {
  //       let vx = map(p.x, 0, video.width, 0, 160);
  //       let vy = map(p.y, 0, video.height, 0, 120);
        
  //       fill(0,0,255);
  //       noStroke();
  //       ellipse(vx, vy, 6, 6);
  //     }
  //   });
  // }
  // pop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}