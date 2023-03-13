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
// And code examples from MediaPipe/Google gesture recognition.

// import * as serialComm from './serialComm.js';
import vision from "https://cdn.skypack.dev/@mediapipe/tasks-vision@latest";
const { GestureRecognizer, FilesetResolver } = vision;
let pHtmlMsg;
let serialOptions = { baudRate: 9600 };
let serial;
let dialPortName = "/dev/cu.usbmodem1413301";
let tempPortName = "/dev/cu.usbmodem1413201";
let dialInData;  
let handRecognized = 0;  
// let serialTwo;

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
let equity = 0,
  surveil = 0,
  uniColor = 0;
//initialize climate value (colors start weird if you don't feed an initial value)
let climate = 5;

//arduino input
let tempQueue = [];
let rotaryVals = [];
let buttonStatus = [];
let gestureVals = [];
let gestureCounter = 0;
let handPresent = false;
let freezeScreenVal = false;

let particlesCanvas;
let screenshotCounter = 0;

//global blurb toggle
let finalOutput = false;
let finalOutputAge = 600;

//store data for future blurbs
let equityBlurb = [
  {
    title: "Objective",
    bolded:
      "Resources are distributed so evenly that everyone has the same access to the same opportunities. Accumulation and greed are widely decried, as our world embraces asceticism.",
  },
  {
    title: "Egalitarian",
    bolded:
      "People are valued for their contributions to society as the concept of wealth as been eliminated altogether, and social mobility is achievable for all.",
  },
  {
    title: "Collectivist",
    bolded:
      "There is a strong sense of social cohesion and belonging. People recognize that their well-being is interconnected with that of others and the planet as a whole.",
  },
  {
    title: "Inclusive",
    bolded:
      "People from diverse backgrounds contribute to community decision-making, while centralized governments distribute resources to local enclaves to use as they see fit.",
  },
  {
    title: "Progressive",
    bolded:
      "Excess resources are channeled towards those with the greatest need, but attempts to reduce inequality spur continuous debate over the concept of need.",
  },
  {
    title: "Auspicious",
    bolded:
      "It was decided that nothing is more fair than the whims of luck, as we embraced the uncertainty and unpredictability of the future.",
  },
  {
    title: "Competitive",
    bolded:
      "Rewards only last for so long as continuous competition and evaluation create isolation and stress for those on top, and endless struggle for those left behind.",
  },
  {
    title: "Nepotism",
    bolded:
      "The well connected are made into powerful and charismatic leaders; more adept at cultivating alliances and rapport than systems and structure.",
  },
  {
    title: "Aristocratic",
    bolded:
      "The masses live vicariously through the eyes and dalliances of elite families as each dominates the cultural and economic framework of society.",
  },
  {
    title: "Dominant",
    bolded:
      "The gap between the rich and the poor has grown into an uncrossable chasm, leaving our bodies and minds broken under the shackles of exploitation.",
  },
];

let climateBlurb = [
  {
    title: "Zealous",
    bolded:
      "What began as ecoterrorism against polluters has broken out into all out war. Some believe we will only succeed in destroying ourselves along with our planet.",
  },
  {
    title: "Vigilant",
    bolded:
      "Rapidly changing investments to react to each looming threat creates continuous destabilization and boom/bust cycles across industries.",
  },
  {
    title: "Responsive",
    bolded:
      "Swathes of land were given back to nature, driving populations across the world into densely packed cities, surrounded by protected green spaces.",
  },
  {
    title: "Informed",
    bolded:
      "As disasters swept the globe, the pleas of those who lost their lands, cultures and families to tides and fire informed our steps towards adaptation and recovery.",
  },
  {
    title: "Ignorant",
    bolded:
      "It was too hard to give up the riches of modernity, as we marched forward with ears ignorant to the cries of the desperate.",
  },
  {
    title: "Careful",
    bolded:
      "For an economy that is quick to change, we found ourselves slow to adapt. It’s a struggle to find balance in a world that demands deprivation from the  already deprived.",
  },
  {
    title: "Skeptical",
    bolded:
      "We have a renewed certainty in our direction; encouraging rigorous debate and valuing temperance, caution, and restraint in our actions to mitigate climate change.",
  },
  {
    title: "Alarmist",
    bolded:
      "Our fear drove us to reflect away the sun and choke the oceans with carbon sinks in a desperate attempt to mitigate the worst of our problems.",
  },
  {
    title: "Dogmatic",
    bolded:
      "The new generations don’t know another way, we have trained our culture on the dogma of green and growth, and it will never change again.",
  },
  {
    title: "Paralyzed",
    bolded:
      "We barreled onwards into destruction not because of an unwillingness to change but because we didn’t know what to change into.",
  },
];

let surveilBlurb = [
  {
    title: "Symbiosis",
    bolded:
      "What was once viewed as transgressive biohacking and amoral experimentation is replaced with a fervor to transcend biological limitations.",
  },
  {
    title: "Partnership",
    bolded:
      "We have been enabled to tap into the collective intelligence of the entire race at a whim through unique algorithms bonded to us at birth.",
  },
  {
    title: "Advisors",
    bolded:
      "Introducing AI tools into policy decisions led to debate on how to draw the lines of influence between us and algorithms; and ensure compassion and empathy.",
  },
  {
    title: "Tools",
    bolded:
      "Post AI-emergence, lawmakers rushed to limit the scope of usage and regulate the application of automated toolsets in the workplace.",
  },
  {
    title: "Disruption",
    bolded:
      "AI has become a strong competitor to human labor, leading to widespread job displacement and the disruption of prevailing economic models.",
  },
  {
    title: "Threat",
    bolded:
      "Concern over the dangers of AI tools in the hands of state enemies lead to forceful elimination of all data collection and training efforts.",
  },
  {
    title: "Replacement",
    bolded:
      "A generation of humans under constant surveillance in the workplace trained their own replacements as they scrambled for a niche in which humans excel.",
  },
  {
    title: "Adversary",
    bolded:
      "Pro and anti-automation factions clash openly and highly mechanized countries experience internal attacks from stateless Luddite sects.",
  },
  {
    title: "Conqueror",
    bolded:
      "AI has developed a world completely devoid of human influence. Decisions are made with machine precision, containing no regard for the emotional tendencies of human beings.",
  },
  {
    title: "Panopticon",
    bolded:
      "Through machine rule we no longer need to compete for anything. They have created an unheard of era of stability for human civilization as we march blindly into the future.",
  },
];

//function to set new Blurbs
function Blurb(title, bolded, paragraph) {
  this.title = title;
  this.bolded = bolded;
  this.paragraph = paragraph;
}

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
  nParticles: 2000,
  particlesCanvasSize: [1920, 1080],
  // videoCanvasSize: [640, 500],
};

let devicesList;
let videoSource;

const pi = 3.1415926535;

// chladni 2D closed-form solution - returns between -1 and 1
const chladni = (x, y, a, b, m, n, sketch) =>
  a * sketch.sin(pi * n * x) * sketch.sin(pi * m * y) +
  b * sketch.sin(pi * m * x) * sketch.sin(pi * n * y);

const demosSection = document.getElementById("demos");
let gestureRecognizer;
let runningMode = "IMAGE";
let enableWebcamButton;
let webcamRunning = false;
const videoHeight = "360px";
const videoWidth = "480px";

async function runDemo() {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );
  gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-tasks/gesture_recognizer/gesture_recognizer.task",
    },
    runningMode: runningMode,
  });
  demosSection.classList.remove("invisible");
}
runDemo();

const videoGesture = document.getElementById("webcam");
videoGesture.style.display = "none";
console.log(videoGesture, "videoGesture");
// const canvasElement = document.getElementById("output_canvas")
// const canvasCtx = canvasElement.getContext("2d")
const gestureOutput = document.getElementById("gesture_output");
// var hideVideo = document.getElementsByClassName("webcam")[0];
// hideVideo.style.display = "none";

// Check if webcam access is supported.
function hasGetUserMedia() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

// If webcam supported, add event listener to button for when user
// wants to activate it.
if (hasGetUserMedia()) {
  enableWebcamButton = document.getElementById("webcamButton");
  enableWebcamButton.addEventListener("click", enableCam);
  // enableWebcamButton.style.display = "none";
} else {
  console.warn("getUserMedia() is not supported by your browser");
}

// Enable the live webcam view and start detection.
function enableCam(event) {
  if (!gestureRecognizer) {
    alert("Please wait for gestureRecognizer to load");
    return;
  }

  if (webcamRunning === true) {
    webcamRunning = false;
    enableWebcamButton.innerText = "ENABLE PREDICTIONS";
  } else {
    webcamRunning = true;
    enableWebcamButton.innerText = "DISABLE PREDICITONS";
  }

  // getUsermedia parameters.
  const constraints = {
    video: true,
  };

  // Activate the webcam stream.
  navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
    videoGesture.srcObject = stream;
    videoGesture.addEventListener("loadeddata", predictWebcam);
  });
}

async function predictWebcam() {
  const webcamElement = document.getElementById("webcam");
  // Now let's start detecting the stream.
  if (runningMode === "IMAGE") {
    runningMode = "VIDEO";
    await gestureRecognizer.setOptions({ runningMode: runningMode });
  }
  let nowInMs = Date.now();
  const results = gestureRecognizer.recognizeForVideo(videoGesture, nowInMs);

  // canvasCtx.save()
  // canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height)

  // canvasElement.style.height = videoHeight
  webcamElement.style.height = videoHeight;
  // canvasElement.style.width = videoWidth
  webcamElement.style.width = videoWidth;
  if (results.landmarks) {
    for (const landmarks of results.landmarks) {
      // drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
      //   color: "#00FF00",
      //   lineWidth: 5
      // })
      // drawLandmarks(canvasCtx, landmarks, { color: "#FF0000", lineWidth: 2 })
    }
  }
  // canvasCtx.restore()
  let gestureName = "";
  if (results.gestures.length > 0) {
    //if hand recognized, flash lights green or blue
    handRecognized = 1; 
    // gestureOutput.style.display = "block";
    // gestureOutput.style.width = videoWidth;
    gestureName = results.gestures[0][0].categoryName;
    // gestureOutput.innerText =
    //   "GestureRecognizer: " +
    //   gestureName +
    //   "\n Confidence: " +
    //   Math.round(parseFloat(results.gestures[0][0].score) * 100) +
    //   "%";
  } else {
    //if no hand, then output white
    handRecognized = 0;
    gestureOutput.style.display = "none";
  }
  //if gesture is open palm, increase with each recogition, if gesture is closed palm, decrease
  if (gestureName === "Open_Palm") {
    console.log("open palm");
    gestureVals.push(1);
  } else if (gestureName === "Closed_Fist") {
    console.log("fist");
    gestureVals.push(-1);
  }
  // Call this function again to keep predicting when the browser is ready.
  if (webcamRunning === true) {
    window.requestAnimationFrame(predictWebcam);
  }
}

// /**
//  * Callback function called by ml5.js HandPose when a pose has been detected
//  */
// function onNewHandPosePrediction(predictions) {
//   if (predictions && predictions.length > 0) {
//     curHandPose = predictions[0];
//     // Grab the palm's x-position and normalize it to [0, 1]
//     const palmBase = curHandPose.landmarks[0];
//     palmXNormalized = palmBase[0] / videoSketch.width;
//     //TODO: gesture code

//     //for arduino code output on hand recognition
//     if (serial.isOpen()) {
//       // serialWriteLightData(sketch, "gesture", v);
//       // const outputData = nf(palmXNormalized, 1, 4);
//       // const timeSinceLastTransmitMs =
//       //   videoSketch.millis() - timestampLastTransmit;
//       // if (timeSinceLastTransmitMs > MIN_TIME_BETWEEN_TRANSMISSIONS_MS) {
//       //   serial.writeLine(outputData);
//       //   timestampLastTransmit = videoSketch.millis();
//       // } else {
//       //   console.log(
//       //     "Did not send  '" +
//       //       outputData +
//       //       "' because time since last transmit was " +
//       //       timeSinceLastTransmitMs +
//       //       "ms"
//       //   );
//       // }
//     }
//   } else {
//     curHandPose = null;
//   }
// }

// const GE = new fp.GestureEstimator([
//   fp.Gestures.VictoryGesture,
//   fp.Gestures.ThumbsUpGesture
// ]);

// const SerialEvents = Object.freeze({
//   CONNECTION_OPENED: "New connection opened",
//   CONNECTION_CLOSED: "Connection closed",
//   DATA_RECEIVED: "New data received",
//   ERROR_OCCURRED: "Error occurred",
//   });

const setupWebSerial = () => {
  // Setup Web Serial using serial.js
  // serial = new serialComm.Serial();
  serial = new Serial();
  serial.on(SerialEvents.CONNECTION_OPENED, onSerialConnectionOpened);
  serial.on(SerialEvents.CONNECTION_CLOSED, onSerialConnectionClosed);
  serial.on(SerialEvents.DATA_RECEIVED, onSerialDataReceived);
  serial.on(SerialEvents.ERROR_OCCURRED, onSerialErrorOccurred);

  // serialTwo = new Serial();

  // serialTwo.on(SerialEvents.CONNECTION_OPENED, onSerialConnectionOpened);
  // serialTwo.on(SerialEvents.CONNECTION_CLOSED, onSerialConnectionClosed);
  // serialTwo.on(SerialEvents.DATA_RECEIVED, onSerialDataReceived);
  // serialTwo.on(SerialEvents.ERROR_OCCURRED, onSerialErrorOccurred);

  // If we have previously approved ports, attempt to connect with them
  serial.autoConnectAndOpenPreviouslyApprovedPort(serialOptions);
  // serialTwo.autoConnectAndOpenPreviouslyApprovedPort(serialOptions);
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
    // console.log("sketchWidth", sketch.width);
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

    if (surveil < 2.5) {
      //create quadrant symmetry — as lines
      sketch.point(this.xOff, this.yOff);
      sketch.point(sketch.width - this.xOff, this.yOff);
      sketch.point(this.xOff, sketch.height - this.yOff);
      sketch.point(sketch.width - this.xOff, sketch.height - this.yOff);

      sketch.strokeWeight(particleStroke / 2);

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

// function drawHand(handPose, videoSketch) {
//   // Draw keypoints. While each keypoints supplies a 3D point (x,y,z), we only draw
//   // the x, y point.
//   for (let j = 0; j < handPose.landmarks.length; j += 1) {
//     const landmark = handPose.landmarks[j];
//     videoSketch.fill(0, 255, 0, 200);
//     videoSketch.noStroke();
//     videoSketch.circle(landmark[0], landmark[1], 10);
//   }
// }

// function drawBoundingBox(handPose, videoSketch) {
//   // Draw hand pose bounding box
//   const bb = handPose.boundingBox;
//   const bbWidth = bb.bottomRight[0] - bb.topLeft[0];
//   const bbHeight = bb.bottomRight[1] - bb.topLeft[1];
//   videoSketch.noFill();
//   videoSketch.stroke("red");
//   videoSketch.rect(bb.topLeft[0], bb.topLeft[1], bbWidth, bbHeight);

//   // Draw confidence
//   videoSketch.fill("red");
//   videoSketch.noStroke();
//   videoSketch.textAlign(videoSketch.LEFT, videoSketch.BOTTOM);
//   videoSketch.textSize(20);
//   videoSketch.text(
//     videoSketch.nfc(handPose.handInViewConfidence, 2),
//     bb.topLeft[0],
//     bb.topLeft[1]
//   );
// }

//redraw screen background
const wipeScreen = (sketch) => {
  //alpha value preserves some particle history, creates slower rate of change when variables adjusted
  sketch.background(10, 5);
  sketch.stroke(255);
};

let te = 0;
//get slider value and change corresponding parameters
const updateParams = (sketch) => {
  // equity = sliders.equity.value(); // 1 - 10
  // equity = 5;
  //equity arduino code
  while (rotaryVals.length > 0) {
    // Grab the least recent value of queue (first in first out)
    // JavaScript is not multithreaded, so we need not lock the queue
    // before reading/modifying.
    let rotaryVal = rotaryVals.shift();
    console.log("value", rotaryVal);
    equity = rotaryVal;
  }
  // climate = sliders.climate.value(); // arduino temp sensor input 1- 10
  // climate temp code
  while (tempQueue.length > 0) {
    // Grab the least recent value of queue (first in first out)
    // JavaScript is not multithreaded, so we need not lock the queue
    // before reading/modifying.
    let tempVal = tempQueue.shift();
    console.log("value", tempVal);
    climate = tempVal;
    te = tempVal;
  }
  //v = sketch.map(climate, 1, 10, 0.05, 0.001);
  // TODO: convert to (1-10?) and correct mapping
  // v = sketch.map(climate, 440, 380, 0.05, 0.001); //vibrations of particles
  // v = sketch.map(climate, 85, 115, 0.05, 0.001); //
  // climate = te;
  climate = te;
  // if (climate != 0) {
  v = sketch.map(climate, 115, 85, 0.05, 0.001); //
  climate = te;
  // console.log("climate after v", climate);
  uniColor = sketch.map(climate, 115, 85, 0, 260);
  climate = te;
  // console.log("climate after unicolor", climate);
  // }
  // console.log("climate after v", climate);
  m = sketch.map(equity, 255, 0, 1, 40); //freq value
  equity = sketch.map(equity, 0, 255, 1, 10); //map 1-10 for ben's code
  while (gestureVals.length > 0) {
    // Grab the least recent value of queue (first in first out)
    // JavaScript is not multithreaded, so we need not lock the queue
    // before reading/modifying.
    let gestureVal = gestureVals.shift();
    console.log("gesture", gestureVal);
    gestureCounter = gestureCounter + gestureVal;
    console.log("surveil", gestureCounter);
    if (gestureCounter > 10) {
      gestureCounter = 10;
    }
    if (gestureCounter < 1) {
      gestureCounter = 1;
    }
    surveil = gestureCounter;
    console.log("surveilFinal", surveil);
  }
  //  surveil = sliders.surveil.value(); // 1 - 10
  console.log("surveilFinal", surveil);
  n = sketch.map(surveil, 10, 1, 1, 10); //freq value
  console.log("surveilFinal", surveil);
  console.log("n", n);
  //surveil = sketch.map(surveil, 1, 10, 1, 10); //map 1-10 for ben's code
  N = 5000; //num particles
  climate = sketch.map(climate, 115, 85, 1, 10); //map 1-10 for ben's code
};

function setFuture() {
  //create arrays to iterate through for each element
  const h1 = document.querySelectorAll(".futureH");
  const p = document.querySelectorAll(".futureP");
  const valueArray = [equity, climate, surveil];
  const blurbArray = [equityBlurb, climateBlurb, surveilBlurb];
  let valueSelector = null;

  for (var i = h1.length - 1; i >= 0; i--) {
    //grab correct text blurb object
    if (valueArray[i] <= 1.5) {
      valueSelector = 0;
    } else if (valueArray[i] <= 2.5) {
      valueSelector = 1;
    } else if (valueArray[i] <= 3.5) {
      valueSelector = 2;
    } else if (valueArray[i] <= 4.5) {
      valueSelector = 3;
    } else if (valueArray[i] <= 5.5) {
      valueSelector = 4;
    } else if (valueArray[i] <= 6.5) {
      valueSelector = 5;
    } else if (valueArray[i] <= 7.5) {
      valueSelector = 6;
    } else if (valueArray[i] <= 8.5) {
      valueSelector = 7;
    } else if (valueArray[i] <= 9.5) {
      valueSelector = 8;
    } else if (valueArray[i] <= 10) {
      valueSelector = 9;
    }

    const futureText = new Blurb(
      blurbArray[i][valueSelector].title,
      blurbArray[i][valueSelector].bolded,
      blurbArray[i][valueSelector].paragraph
    );
    const span = document.createElement("span");
    span.innerHTML = futureText.bolded + " ";
    console.log(h1[i]);

    h1[i].innerHTML = futureText.title;
    p[i].innerHTML = "";
    p[i].appendChild(span);
    // p[i].append(futureText.paragraph);
  }

  finalOutput = true;
}

function showFuture() {
  const doc = document.querySelector("#future-container");

  if (finalOutputAge <= 0) {
    //reset final output values
    doc.style.display = "none";
    finalOutput = false;
    finalOutputAge = 600;
  } else {
    doc.style.display = "flex";
    finalOutputAge -= 0.5;
  }
}

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

function preload() {
  navigator.mediaDevices.enumerateDevices().then(getDevices);
}

function getDevices(devices) {
  for (let i = 0; i < devices.length; ++i) {
    let deviceInfo = devices[i];
    if (deviceInfo.kind == "videoinput") {
      console.log("Device name :", devices[i].label);
      console.log("DeviceID :", devices[i].deviceId);
      if (
        devices[i].deviceId ===
        "c4d0106361ecb67487d2f9cb7f4a62fda3661f1abae710e57a6bf5709442ce74"
      ) {
        console.log("CHOSEN", devices[i].label);
        videoSource = devices[i].deviceId;
      }
    }
  }
}

const freezeScreen = (sketch, canvas) => {
  while (buttonStatus.length > 0) {
    // Grab the least recent value of queue (first in first out)
    // JavaScript is not multithreaded, so we need not lock the queue
    // before reading/modifying.
    let buttonStatusVal = buttonStatus.shift();
    freezeScreenVal = buttonStatusVal;

    if (freezeScreenVal) {
      let email = prompt("Please enter your email:", "fredolin@frog.co");
      console.log("email " + email); //TODO: add gmail api and send email with image and selections
      //TODO: possibly send visualization to slideshow via google drive or get email and name
      sketch.saveCanvas(particlesCanvas, "frogPopPartyWorld " + email, "jpg");
      setFuture();
    }
  }
};

// get the list of ports:
function printList(portList) {
  // portList is an array of serial port names
  for (var i = 0; i < portList.length; i++) {
    // Display the list the console:
    console.log(i + portList[i]);
  }
}

let particlesSketch = new p5((sketch) => {
  preload();
  sketch.setup = () => {
    particlesCanvas = sketch.createCanvas(...settings.particlesCanvasSize);
    // particlesCanvas.parent('sketch-container');
    // setupWebSerial();
    //setup web serial
    serial = new p5.SerialPort(); // make a new instance of the serialport library
    serial.on("list", printList); // set a callback function for the serialport list event

    serial.on("connected", serverConnected); // callback for connecting to the server
    serial.on("open", portOpen); // callback for the port opening
    serial.on("data", serialEvent); // callback for when new data arrives
    serial.on("error", serialError); // callback for errors
    serial.on("close", portClose); // callback for the port closing

    serial.list(); // list the serial ports
    serial.open(dialPortName);
    serial.open(tempPortName);
    serial.list(); // list the serial ports
    //set framerate for visualization
    sketch.frameRate(60);
    //set values for sliders
    // sliders = {
    //   num: select("#numSlider"), // number of particles
    //   equity: select("#equitySlider"),
    //   climate: select("#climateSlider"),
    //   surveil: select("#surveilSlider"),
    // };

    //setup particles for visualization
    setupParticles(sketch);
  };

  // sketch.keyPressed = () => {
  //   let email = prompt("Please enter your email:", "fredolin@frog.co");
  //   console.log("email " + email); //TODO: add gmail api and send email with image and selections
  //   //TODO: possibly send visualization to slideshow via google drive or get email and name
  //   sketch.saveCanvas(particlesCanvas, "frogPopPartyWorld " + email, "jpg");
  // };

  // sketch.onMousePressed = () => {
  //   if (!serial.isOpen()) {
  //     serial.connectAndOpen(null, serialOptions);
  //   }
  // }

  sketch.draw = () => {
    console.log("sensor in Value", dialInData);
    if (finalOutput == false) {
      wipeScreen(sketch);
      updateParams(sketch);
      moveParticles(sketch);
    }
    if (finalOutput) {
      showFuture();
    }
    freezeScreen(sketch, particlesCanvas);
    // wipeScreen(sketch);
    //  updateParams(sketch);
    //  moveParticles(sketch);
    // freezeScreen(sketch,particlesCanvas);
  };
}, "left");

function serverConnected() {
  console.log('connected to server.');
}
 
function portOpen() {
  console.log('the serial port opened.')
}
 
function serialEvent() {
  // dialInData = Number(serial.read());
  dialInData = serial.readLine();
  console.log("fist", handRecognized);
  serial.write(handRecognized);
  // handRecognized = 0;
    //   console.log("webcamOutput");
    //   const outputData =  1;
    //   const timeSinceLastTransmitMs = millis() - timestampLastTransmit;
    //   if(timeSinceLastTransmitMs > MIN_TIME_BETWEEN_TRANSMISSIONS_MS){
    //     serial.writeLine(outputData);
    //     timestampLastTransmit = millis();
  let nextArduinoInput = dialInData;
  let incomingFloatValue;
  // let incomingFloatValue = parseFloat(nextArduinoInput);
  // console.log("incoming", incomingFloatValue);
  //temperature code
  // tempQueue.push(parseFloat(newData));
  // console.log(tempQueue);
  if (nextArduinoInput.includes("temp")) {
    incomingFloatValue = nextArduinoInput.match(/(\d+)/)[0];
    tempQueue.push(incomingFloatValue);
    console.log("hit temp ", incomingFloatValue);
  }
  //equity rotary arduino code
  if (nextArduinoInput.includes("dial")) {
    incomingFloatValue = nextArduinoInput.match(/(\d+)/)[0];
    rotaryVals.push(incomingFloatValue);
    console.log("hit dial", incomingFloatValue);
  }
  //button arduino code
  if (nextArduinoInput.includes("button")) {
    incomingFloatValue = nextArduinoInput.match(/(\d+)/)[0];
    buttonStatus.push(incomingFloatValue);
    console.log("hit button ", incomingFloatValue);
  }
}
 
function serialError(err) {
  console.log('Something went wrong with the serial port. ' + err);
}
 
function portClose() {
  console.log('The serial port closed.');
}

// var videoSourceConstraints = {
//   video: {
//     deviceId: {
//       exact: videoSource,
//     },
//   },
// };

// let videoSketch = new p5((videoSketch) => {
//   // preload();
//   videoSketch.setup = () => {
//     videoSketch.createCanvas(...settings.videoCanvasSize);
//     //setup web serial for arduino connection
//     // setupWebSerial();
//     // getPorts();

//     // Add in a lil <p> element to provide messages. This is optional
//     pHtmlMsg = videoSketch.createP(
//       "Click anywhere on this page to open the serial connection dialog"
//     );

//     //video setup
//     video = videoSketch.createCapture(videoSourceConstraints);
//     // Hide the video element, and just show the canvas
//     video.hide();

//     //handpose model setup
//     setupHandPose(video, videoSketch);
//   };

//   videoSketch.draw = () => {
//     videoSketch.image(video, 0, 0, videoSketch.width, videoSketch.height);

//     if (!isHandPoseModelInitialized) {
//       videoSketch.background(100);
//       videoSketch.push();
//       videoSketch.textSize(32);
//       videoSketch.textAlign(videoSketch.CENTER);
//       videoSketch.fill(255);
//       videoSketch.noStroke();
//       videoSketch.text(
//         "Waiting for HandPose model to load...",
//         videoSketch.width / 2,
//         videoSketch.height / 2
//       );
//       videoSketch.pop();
//     }

//     if (curHandPose) {
//       drawHand(curHandPose, videoSketch);
//       drawBoundingBox(curHandPose, videoSketch);

//       // draw palm info
//       videoSketch.noFill();
//       videoSketch.stroke(255);
//       const palmBase = curHandPose.landmarks[0];
//       videoSketch.circle(palmBase[0], palmBase[1], kpSize);

//       videoSketch.noStroke();
//       videoSketch.fill(255);
//       videoSketch.text(
//         videoSketch.nf(palmXNormalized, 1, 4),
//         palmBase[0] + kpSize,
//         palmBase[1] + videoSketch.textSize() / 2
//       );
//     }
//   };
// }, "right");

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

  let nextArduinoInput = newData;
  //let incomingFloatValue;
  // let incomingFloatValue = parseFloat(nextArduinoInput);
  // console.log("incoming", incomingFloatValue);
  //temperature code
  // tempQueue.push(parseFloat(newData));
  // console.log(tempQueue);
  if (nextArduinoInput.includes("temp")) {
    incomingFloatValue = nextArduinoInput.match(/(\d+)/)[0];
    tempQueue.push(incomingFloatValue);
    console.log("hit temp ", incomingFloatValue);
  }
  //equity rotary arduino code
  if (nextArduinoInput.includes("dial")) {
    incomingFloatValue = nextArduinoInput.match(/(\d+)/)[0];
    rotaryVals.push(incomingFloatValue);
    console.log("hit dial", incomingFloatValue);
  }
  //button arduino code
  if (nextArduinoInput.includes("button")) {
    incomingFloatValue = nextArduinoInput.match(/(\d+)/)[0];
    buttonStatus.push(incomingFloatValue);
    console.log("hit button ", incomingFloatValue);
  }
}

/**
 * Called by open serial settings button from command palette
 */
function openSerial() {
  if (!serial.isOpen()) {
    serial.connectAndOpen(null, serialOptions);
  }
  // if (!serialTwo.isOpen()) {
  //   serialTwo.connectAndOpen(null, serialOptions);
  // }
}

function blackout() {
  document.getElementById("scrim").style.visibility = "visible";
}
function endBlackout() {
  document.getElementById("scrim").style.visibility = "hidden";
}
