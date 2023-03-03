// This code is written for frog's SXSW 2023 celebration for the Room of Silence.
// by Kellyn Dassler, Ben Ellsworth, and Alexander Kennedy
//
// A special thanks for the code adapted from the following creators:
//
// Some of this is code is part of a lesson series on creating a servo motor controlled by
// the user's hand, as recognized by a real-time webcam stream and the ml5 HandPose
// library.
//
// See our full step-by-step lesson:
// https://makeabilitylab.github.io/physcomp/communication/handpose-serial.html
//
// Also available in the p5.js online editor
// https://editor.p5js.org/jonfroehlich/sketches/vMbPOkdzu
//
//
// by Jon E. Froehlich
// @jonfroehlich
// http://makeabilitylab.io/
//
// We also adapted code by Addie Barron from https://github.com/addiebarron/chladni.
//

let pHtmlMsg;
let serialOptions = { baudRate: 115200 };
let serial;

let handPoseModel;
let video;
let curHandPose = null;
let isHandPoseModelInitialized = false;
let kpSize = 10;
let palmXNormalized = 0;
let timestampLastTransmit = 0;
const MIN_TIME_BETWEEN_TRANSMISSIONS_MS = 50; // 50 ms is ~20 Hz

//particles visualization variables
let particles, sliders, m, n, v, N;
let equity, surveil, uniColor;

let climate = 5;

//throttles color range so it stays between red and purple
let maxColor = 260;

//variable associated with stroke
let strokeVar = 1;

// chladni frequency params
let a = 1,
  b = 1;

// vibration strength params
let A = 0.02;
let minWalk = 0.002;

const settings = {
  nParticles: 10000,
  particlesCanvasSize: [640, 500],
  videoCanvasSize: [640, 500],
};

const pi = 3.1415926535;

// chladni 2D closed-form solution - returns between -1 and 1
const chladni = (x, y, a, b, m, n, sketch) =>
  a * sketch.sin(pi * n * x) * sketch.sin(pi * m * y) +
  b * sketch.sin(pi * m * x) * sketch.sin(pi * n * y);

/**
 * Callback function called by ml5.js HandPose when the HandPose model is ready
 * Will be called once and only once
 */
function onHandPoseModelReady() {
  console.log("HandPose model ready!");
  isHandPoseModelInitialized = true;
}

/**
 * Callback function called by ml5.js HandPose when a pose has been detected
 */
function onNewHandPosePrediction(predictions) {
  if (predictions && predictions.length > 0) {
    curHandPose = predictions[0];
    // Grab the palm's x-position and normalize it to [0, 1]
    const palmBase = curHandPose.landmarks[0];
    palmXNormalized = palmBase[0] / videoSketch.width;

    if (serial.isOpen()) {
      const outputData = nf(palmXNormalized, 1, 4);
      const timeSinceLastTransmitMs =
        videoSketch.millis() - timestampLastTransmit;
      if (timeSinceLastTransmitMs > MIN_TIME_BETWEEN_TRANSMISSIONS_MS) {
        serial.writeLine(outputData);
        timestampLastTransmit = videoSketch.millis();
      } else {
        console.log(
          "Did not send  '" +
            outputData +
            "' because time since last transmit was " +
            timeSinceLastTransmitMs +
            "ms"
        );
      }
    }
  } else {
    curHandPose = null;
  }
}

const setupHandPose = (video, videoSketch) => {
  //Get handpose model from ml5 library
  handPoseModel = ml5.handpose(video, onHandPoseModelReady);
  // Call onNewHandPosePrediction every time a new handPose is predicted
  handPoseModel.on("predict", onNewHandPosePrediction);
};

const setupWebSerial = () => {
  // Setup Web Serial using serial.js
  serial = new Serial();
  serial.on(SerialEvents.CONNECTION_OPENED, onSerialConnectionOpened);
  serial.on(SerialEvents.CONNECTION_CLOSED, onSerialConnectionClosed);
  serial.on(SerialEvents.DATA_RECEIVED, onSerialDataReceived);
  serial.on(SerialEvents.ERROR_OCCURRED, onSerialErrorOccurred);

  // If we have previously approved ports, attempt to connect with them
  serial.autoConnectAndOpenPreviouslyApprovedPort(serialOptions);
};

const setupParticles = (sketch) => {
  // particle array
  particles = [];
  for (let i = 0; i < settings.nParticles; i++) {
    particles[i] = new Particle(sketch);
  }
};

/* Particle dynamics */

class Particle {
  constructor(sketch) {
    this.x = sketch.random(0, 1);
    this.y = sketch.random(0, 1);
    this.prevX = this.x;
    this.prevY = this.y;
    this.stochasticAmplitude;

    //create age degradation
    this.age = sketch.random(1000, 5000);

    let currentHue = sketch.map(climate, 1, 10, 0, maxColor);

    this.h = sketch.random(
      sketch.abs(currentHue - 5),
      sketch.abs(currentHue + 5)
    );
    this.colorDif = currentHue - this.h;

    this.s = sketch.random(75, 100);
    this.b = sketch.random(75, 100);

    //assign randomized color to variable
    this.color = [this.h, this.s, this.b, 100];
    this.stroke = sketch.map(this.age, 5000, 1000, 0, 1);

    this.updateOffsets(sketch);
  }

  move(sketch) {
    // what is our chladni value i.e. how much are we vibrating? (between -1 and 1, zeroes are nodes)
    let mMap = sketch.map(
      sketch.abs((sketch.width / 4) * this.x),
      0,
      sketch.width / 2,
      1,
      m
    );
    let nMap = sketch.map(
      sketch.abs((sketch.width / 4) * this.y),
      0,
      sketch.width / 2,
      1,
      n
    );
    let eq = chladni(this.x, this.y, a, b, mMap, nMap, sketch);

    // set the amplitude of the move -> proportional to the vibration
    this.stochasticAmplitude = v * sketch.abs(eq);

    if (this.stochasticAmplitude <= minWalk) this.stochasticAmplitude = minWalk;
    this.prevX = this.x;
    this.prevY = this.y;

    // perform one random walk
    this.x += sketch.random(
      -this.stochasticAmplitude,
      this.stochasticAmplitude
    );
    this.y += sketch.random(
      -this.stochasticAmplitude,
      this.stochasticAmplitude
    );

    if (this.age > -10) {
      this.age -= 1 * this.stroke * equity;
    }

    this.updateOffsets(sketch);
  }

  updateOffsets(sketch) {
    // handle edges
    if (this.x <= 0) this.x = 0;
    if (this.x >= 1) this.x = 1;
    if (this.y <= 0) this.y = 0;
    if (this.y >= 1) this.y = 1;

    // convert to screen space
    this.xOff = (sketch.width / 2) * this.x;
    this.yOff = (sketch.height / 2) * this.y;
    this.xPrevOff = (sketch.width / 2) * this.prevX;
    this.yPrevOff = (sketch.height / 2) * this.prevY;
  }

  show(sketch) {
    sketch.colorMode(sketch.HSB, 360, 100, 100, 100);
    // print(uniColor + ", " + this.h)

    let colorChange = this.colorDif * sketch.map(surveil, 1, 10, 10, 1);
    // print(colorChange);

    //update Hue
    if (this.h > uniColor) {
      this.h = sketch.abs(this.h - sketch.abs(uniColor - this.h) + colorChange);
      if (this.h > maxColor) {
        this.h = maxColor;
      } else if (this.h < 0) {
        this.h = 0;
      }
    } else if (this.h < uniColor) {
    }
    {
      this.h = sketch.abs(this.h + sketch.abs(uniColor - this.h) + colorChange);
      if (this.h > maxColor) {
        this.h = maxColor;
      } else if (this.h < 0) {
        this.h = 0;
      }
    }

    this.s = sketch.map(this.age, 0, 500, 0, 100);

    //update color
    this.color = [this.h, this.s, this.b, 100];

    //set up stroke calculation
    let particleStroke = null;

    let strokeRatio = this.stroke * equity;

    //define a ratio of potentiality for stroke widths (equity slider)
    // this is kind of a mess because there are different ratios at different breakpoints
    // I don't advise messing with it
    if (equity <= 2) {
      if (strokeRatio <= 1.5) {
        particleStroke = 2;
      } else {
        particleStroke = 4;
      }
    } else if (equity <= 4) {
      if (strokeRatio <= 1.5) {
        particleStroke = 2;
      } else if (strokeRatio <= 2.75) {
        particleStroke = 4;
      } else if (strokeRatio <= 3) {
        particleStroke = 10;
      } else if (strokeRatio <= 3.5) {
        particleStroke = 1;
      } else {
        particleStroke = 2;
      }
    } else if (equity <= 5) {
      if (strokeRatio <= 1.75) {
        particleStroke = 2;
      } else if (strokeRatio <= 2.75) {
        particleStroke = 4;
      } else if (strokeRatio <= 3.5) {
        particleStroke = 1;
      } else if (strokeRatio <= 4) {
        particleStroke = 6;
      } else if (strokeRatio <= 4.05) {
        particleStroke = 10;
      } else if (strokeRatio <= 5) {
        particleStroke = 1;
      }
    } else if (equity <= 7) {
      if (strokeRatio <= 1.75) {
        particleStroke = 2;
      } else if (strokeRatio <= 2.75) {
        particleStroke = 4;
      } else if (strokeRatio <= 3.5) {
        particleStroke = 1;
      } else if (strokeRatio <= 4) {
        particleStroke = 6;
      } else if (strokeRatio <= 4.1) {
        particleStroke = 10;
      } else if (strokeRatio <= 5) {
        particleStroke = 2;
      } else if (strokeRatio <= 5.01) {
        particleStroke = 30;
      } else if (strokeRatio <= 6.2) {
        particleStroke = 2;
      } else if (strokeRatio <= 6.3) {
        particleStroke = 10;
      } else if (strokeRatio <= 7.1) {
        particleStroke = 1;
      }
    } else if (equity <= 9) {
      if (strokeRatio <= 0.01) {
        particleStroke = 50;
      } else if (strokeRatio <= 0.1) {
        particleStroke = 10;
      } else if (strokeRatio <= 1) {
        particleStroke = 6;
      } else if (strokeRatio <= 3) {
        particleStroke = 2;
      } else {
        particleStroke = 1;
      }
    } else if (equity <= 10) {
      if (strokeRatio <= 0.004) {
        particleStroke = 50;
      } else if (strokeRatio <= 0.09) {
        particleStroke = 10;
      } else {
        particleStroke = 1;
      }
    }
    // end of stroke width bs

    //set drawn stroke
    sketch.strokeWeight(particleStroke);
    sketch.stroke(...this.color);

    if (surveil > 8.5) {
      //create quadrant symmetry — as lines

      sketch.line(this.xOff, this.yOff, this.xPrevOff, this.yPrevOff);
      sketch.line(
        sketch.width - this.xOff,
        this.yOff,
        sketch.width - this.xPrevOff,
        this.yPrevOff
      );
      sketch.line(
        this.xOff,
        sketch.height - this.yOff,
        this.xPrevOff,
        sketch.height - this.yPrevOff
      );
      sketch.line(
        sketch.width - this.xOff,
        sketch.height - this.yOff,
        sketch.width - this.xPrevOff,
        sketch.height - this.yPrevOff
      );
    } else {
      //create quadrant symmetry — as points
      sketch.point(this.xOff, this.yOff);
      sketch.point(sketch.width - this.xOff, this.yOff);
      sketch.point(this.xOff, sketch.height - this.yOff);
      sketch.point(sketch.width - this.xOff, sketch.height - this.yOff);
    }
  }
}

function drawHand(handPose, videoSketch) {
  // Draw keypoints. While each keypoints supplies a 3D point (x,y,z), we only draw
  // the x, y point.
  for (let j = 0; j < handPose.landmarks.length; j += 1) {
    const landmark = handPose.landmarks[j];
    videoSketch.fill(0, 255, 0, 200);
    videoSketch.noStroke();
    videoSketch.circle(landmark[0], landmark[1], 10);
  }
}

function drawBoundingBox(handPose, videoSketch) {
  // Draw hand pose bounding box
  const bb = handPose.boundingBox;
  const bbWidth = bb.bottomRight[0] - bb.topLeft[0];
  const bbHeight = bb.bottomRight[1] - bb.topLeft[1];
  videoSketch.noFill();
  videoSketch.stroke("red");
  videoSketch.rect(bb.topLeft[0], bb.topLeft[1], bbWidth, bbHeight);

  // Draw confidence
  videoSketch.fill("red");
  videoSketch.noStroke();
  videoSketch.textAlign(videoSketch.LEFT, videoSketch.BOTTOM);
  videoSketch.textSize(20);
  videoSketch.text(
    videoSketch.nfc(handPose.handInViewConfidence, 2),
    bb.topLeft[0],
    bb.topLeft[1]
  );
}

//redraw screen background
const wipeScreen = (sketch) => {
  //alpha value preserves some particle history, creates slower rate of change when variables adjusted
  sketch.background(10, 10);
  sketch.stroke(255);
};

//get slider value and change corresponding parameters
const updateParams = (sketch) => {
  equity = sliders.equity.value();
  climate = sliders.climate.value();
  surveil = sliders.surveil.value();
  m = sketch.map(equity, 1, 10, 1, 40);
  n = sketch.map(surveil, 1, 10, 1, 40);
  v = sketch.map(climate, 1, 10, 0.05, 0.001);
  N = sliders.num.value();
  uniColor = sketch.map(climate, 1, 10, 0, 260);
};

const moveParticles = (sketch) => {
  let movingParticles = particles.slice(0, N);

  // particle movement
  for (let i = movingParticles.length - 1; i >= 0; i--) {
    particles[i].move(sketch);
    particles[i].show(sketch);
    if (particles[i].age <= -5) {
      particles.splice(i, 1);

      let p = new Particle(sketch);
      particles.push(p);
    }
  }
};

let particlesSketch = new p5((sketch) => {
  sketch.setup = () => {
    sketch.createCanvas(...settings.particlesCanvasSize);

    //set framerate for visualization
    sketch.frameRate(30);

    //set values for sliders
    sliders = {
      num: sketch.select("#numSlider"), // number of particles
      equity: sketch.select("#equitySlider"),
      climate: sketch.select("#climateSlider"),
      surveil: sketch.select("#surveilSlider"),
    };

    //setup particles for visualization
    setupParticles(sketch);
  };

  sketch.draw = () => {
    wipeScreen(sketch);
    updateParams(sketch);
    moveParticles(sketch);
  };
}, "left");

let videoSketch = new p5((videoSketch) => {
  videoSketch.setup = () => {
    videoSketch.createCanvas(...settings.videoCanvasSize);
    //setup web serial for arduino connection
    setupWebSerial();

    // Add in a lil <p> element to provide messages. This is optional
    pHtmlMsg = videoSketch.createP(
      "Click anywhere on this page to open the serial connection dialog"
    );
    //video setup
    video = videoSketch.createCapture(videoSketch.VIDEO);
    // Hide the video element, and just show the canvas
    video.hide();

    //handpose model setup
    setupHandPose(video, videoSketch);
  };

  videoSketch.draw = () => {
    // videoSketch.background(0);
    // videoSketch.fill(255);
    // videoSketch.rect(400, 500, 50, 50);
    videoSketch.image(video, 0, 0, videoSketch.width, videoSketch.height);

    if (!isHandPoseModelInitialized) {
      videoSketch.background(100);
      videoSketch.push();
      videoSketch.textSize(32);
      videoSketch.textAlign(videoSketch.CENTER);
      videoSketch.fill(255);
      videoSketch.noStroke();
      videoSketch.text(
        "Waiting for HandPose model to load...",
        videoSketch.width / 2,
        videoSketch.height / 2
      );
      videoSketch.pop();
    }

    if (curHandPose) {
      drawHand(curHandPose, videoSketch);
      drawBoundingBox(curHandPose, videoSketch);

      // draw palm info
      videoSketch.noFill();
      videoSketch.stroke(255);
      const palmBase = curHandPose.landmarks[0];
      videoSketch.circle(palmBase[0], palmBase[1], kpSize);

      videoSketch.noStroke();
      videoSketch.fill(255);
      videoSketch.text(
        videoSketch.nf(palmXNormalized, 1, 4),
        palmBase[0] + kpSize,
        palmBase[1] + videoSketch.textSize() / 2
      );
    }
  };
}, "right");

/**
 * Callback function by serial.js when there is an error on web serial
 *
 * @param {} eventSender
 */
function onSerialErrorOccurred(eventSender, error) {
  console.log("onSerialErrorOccurred", error);
  pHtmlMsg.html(error);
}

/**
 * Callback function by serial.js when web serial connection is opened
 *
 * @param {} eventSender
 */
function onSerialConnectionOpened(eventSender) {
  console.log("onSerialConnectionOpened");
  pHtmlMsg.html("Serial connection opened successfully");
}

/**
 * Callback function by serial.js when web serial connection is closed
 *
 * @param {} eventSender
 */
function onSerialConnectionClosed(eventSender) {
  console.log("onSerialConnectionClosed");
  pHtmlMsg.html("onSerialConnectionClosed");
}

/**
 * Callback function serial.js when new web serial data is received
 *
 * @param {*} eventSender
 * @param {String} newData new data received over serial
 */
function onSerialDataReceived(eventSender, newData) {
  console.log("onSerialDataReceived", newData);
  pHtmlMsg.html("onSerialDataReceived: " + newData);
}

/**
 * Called automatically by the browser through p5.js when mouse clicked
 */
function mouseClicked() {
  if (!serial.isOpen()) {
    serial.connectAndOpen(null, serialOptions);
  }
}
