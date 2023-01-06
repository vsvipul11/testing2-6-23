const canvas_cont = document.getElementById('vid_container');


// let frameSets = [];
// let smoothFrame = [];

// /**
//  * smoothLandmarks
//  * @param {Object} results This should be coming directly from Mediapipe
//  * @param {Function} onResults Optional: If you want to call other function instead of getting return
//  * @returns {Void}
//  */
// const smoothLandmarks = (results) => {
//   // Pushing frame at the end of frameSet array
//   if (results.multiHandLandmarks) {
//     frameSets.push(results.multiHandLandmarks);
//     console.log("hello vipul" , frameSets);
//   }
  

//   if (frameSets.length === 8) {
//     // This loop will run 21 time to make average of each joint
//     for (let i = 0; i  < 21; i++) {
//       // Making an array of each joint coordinates
//          let x = frameSets.map((a) => a[0][i].x);
//          let y = frameSets.map((a) => a[0][i].y);
//          let z = frameSets.map((a) => a[0][i].z);
//     //   let visibility = frameSets.map((a) => a[i].visibility);

//       // Sorting the array into ascending order
//          x = x.sort((a, b) => a - b);
//          y = y.sort((a, b) => a - b);
//          z = z.sort((a, b) => a - b);
//     //   visibility = visibility.sort((a, b) => a - b);

//       // Dropping 2 min and 2 max coordinates
//       x = x.slice(2, 6);
//       y = y.slice(2, 6);
//       z = z.slice(2, 6);
//     //   visibility = visibility.slice(2, 6);

//       // Making the average of 4 remaining coordinates
//       smoothFrame[i] = {
//         x: x.reduce((a, b) => a + b, 0) / x.length,
//         y: y.reduce((a, b) => a + b, 0) / y.length,
//         z: z.reduce((a, b) => a + b, 0) / z.length,
//         // visibility: visibility.reduce((a, b) => a + b, 0) / visibility.length,
//       };
//     }

//     // Removing the first frame from frameSet
//     frameSets.shift();
//   }

//   // after first 8 frames we have averaged coordinates, So now updating the handLandmarks with averaged coordinates
//   if (smoothFrame.length > 0) {
//     console.log(smoothFrame);
//     results.multiHandLandmarks = smoothFrame;
//   }

//   return  results;
// };

const fpsControl = new FPS();
var width = canvas_cont.offsetWidth;
var height = canvas_cont.offsetHeight;

if (height > width) {
    var x = width;
    width = height;
    height = width;
} else {
    width = width * 0.85;
}

// width=1280;
// height=720;
// move these also over cdn.
var libs = './libs/';
var img_url = "https://d3rodw1h7g0i9b.cloudfront.net/realtime-tryon-images/"
var img_sku = "default"
var PIX_RATIO = 1; // increase resolution...: may be quit slow.
width = width * PIX_RATIO;
height = height * PIX_RATIO;
const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
canvasElement.width = width;
canvasElement.height = height;
const canvasCtx = canvasElement.getContext('2d');

var fps_elem = document.getElementById('fps_count');
// var last_fps_elem = document.getElementById('last_fps')
var hand_elem = document.getElementById('hand_elem');
const spinner = document.querySelector('.loading');

// var frames = 0;
// var last_time = 0;
// var last_fps = 0;
// var fps = 0;
// var avg_fps = 0;
const start = new Date();


var images = []
var load_images = []
var imgproportion = []

const prec = 16;

function roundOf(c) {
    return Math.round((c + Number.EPSILON) * (10 ** prec)) / (10 ** prec)
}

function get(name) {
    if (name = (new RegExp('[?&]' + encodeURIComponent(name) + '=([^&]*)')).exec(location.search))
        return decodeURIComponent(name[1]);
}
var sku_param = get('sku')
if (sku_param) {
    img_sku = sku_param;
}

function roundOflandmarks(landmarks) {
    ls = []
    for (var l of landmarks) {
        console.log(l)
        l.x = roundOf(l.x)
        l.y = roundOf(l.y)
        l.z = roundOf(l.z)
        console.log(l)
        ls.push(l)
    }
    // console.log(ls[13])
    return ls
}

function getAngle(p1, p2) {
    // take input as normalized coordinates returns angle in degree.
    return (Math.atan2((p1.y - p2.y) * height, (p1.x - p2.x) * width) * 180) / Math.PI
}

function getDistance(p1, p2) {
    // take input as normalized coordinates
    return Math.sqrt(Math.pow((p2.y - p1.y) * height, 2) + Math.pow((p2.x - p1.x) * width, 2))
}

function dividePoint(p1, p2, m) {
    // point at 1:m division returns normalized coordinates.
    var point = {}
    point['x'] = (p1.x + p2.x * m) / (m + 1)
    point['y'] = (p1.y + p2.y * m) / (m + 1)
    return point
}

function drawRing(canvas ,landmarks, label) {
    // need to optimize this function..
    var context = canvas.getContext('2d')

    var ringWidth = getDistance( landmarks[13], landmarks[9])
    var ringLoc = dividePoint(landmarks[13], landmarks[14], 2)
    var ringRotationX = getAngle(landmarks[14], landmarks[13])

    var I_FACTOR = 0.06; // correction/ignorance factor.
    var up = (landmarks[13].y - landmarks[16].y) * height
    var up_x = (landmarks[13].x - landmarks[16].x) * width
    var front = (landmarks[5].x - landmarks[17].x) * width
    var front_y = (landmarks[5].y - landmarks[17].y) * height

    var frontTilt = (Math.abs(front) < width * I_FACTOR) && (Math.abs(front_y) < height * I_FACTOR)
    var upTilt = (Math.abs(up) < height * I_FACTOR) && (Math.abs(up_x) < width * I_FACTOR)
    var isConfused = upTilt || frontTilt

    /// if thumb not present inside screen  isConfused = true
    if (!isConfused) {
        context.save()
        context.translate(ringLoc.x * width, ringLoc.y * height)
        var isHandUP = up > 0
        var isHandFrontal = front < 0
        if (label === 'Left') isHandFrontal = !isHandFrontal;

        var ringFace = 1 // back face : default
        if (isHandFrontal) ringFace = 0 // set it front if front face
        if (!isHandUP) ringFace = 1 - ringFace // toggle if hand tilted to down.

        var aspect_ratio = images[ringFace].width / images[ringFace].height
        var h = ringWidth / aspect_ratio // coresponding..height..
        context.rotate(((ringRotationX + 90) * Math.PI) / 180)
        context.drawImage(images[ringFace], ringLoc.x - ringWidth / 2, ringLoc.y - h / 2, ringWidth, h)
        context.restore()
    }
}



const hands = new Hands({
    locateFile: (file) => {
        console.log("loading..", file)
        //return `${libs}hands/${file}`;
        // return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
         return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.1/${file}`;
    }
});
hands.setOptions({
    selfieMode: 1,
    maxNumHands: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});

// hands.onResults((results) => smoothLandmarks(results, onResults));

function onResults(results) {

    fpsControl.tick();

    // console.log(fpsControl)
    // canvasCtx.drawImage(fpsControl.b,0, 0, 100, 100)
    spinner.style.display = 'none';
    videoElement.style.disable = 'none';
    // frames += 1;
    // var seconds = Math.floor((new Date().getTime() - start.getTime()) / 1000)1zs
    // avg_fps = Math.floor(frames / seconds)
    // if (last_time > seconds) {
    //     last_time = seconds
    //     last_fps = frames
    // }
    // var cur_fps = Math.floor((frames - last_fps) / (seconds - last_time))
    // fps_elem.innerHTML = "Avg Fps: " + avg_fps + ", Last FPS:" + cur_fps;
    fps_elem.innerHTML = fpsControl.b.outerHTML;
    // last_fps_elem.innerHTML = fpsControl.a

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, width, height);
    canvasCtx.drawImage(results.image, 0, 0, width, height);


    var canvas = document.getElementById('video')
    if (canvas) {
        var hand_html = '';
        if (results.multiHandLandmarks) {
            var i = 0;
            
            for (var landmarks of results.multiHandLandmarks ) {
               
                 console.log(landmarks[13])
             
                //  console.log(landmarks[13])
                            //    drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS,
                            //        { color: '#00FF00', lineWidth: 5 });
                            //    drawLandmarks(canvasCtx, landmarks, { color: '#FF0000', lineWidth: 2 });
                drawRing(canvas, landmarks, results.multiHandedness[i].label);
                i += 1;
              
            }
            var hand_html = '';
            for (const hand of results.multiHandedness) {
                hand_html += hand.label + " (" + Math.floor(hand.score * 100, 3) + "% ) <br/>"
            }
        }
    }
    hand_elem.innerHTML = hand_html
    canvasCtx.restore();
}

async function f() {
    var imgPathf = `${img_url}${img_sku}/front.png`
    var imgObjf = new Image()
    imgObjf.src = imgPathf

    var imgPathb = `${img_url}${img_sku}/back.png`
    var imgObjb = new Image()
    imgObjb.src = ('./img/r2.png')
    images = [imgObjf, imgObjb]
    for (var i = 0; i < images.length; i++) {
        images[i].onload = function() {
            // images.push(images[i])
            //console.log(this.width + 'x' + this.height)
            imgproportion.push(this.width / this.height)
        }
    }
}
f().then(function() {
    hands.onResults(onResults);
});


const camera = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({
            image: videoElement
        })
    },
    width: width / PIX_RATIO,
    height: height / PIX_RATIO,
})
camera.start()




// Present a control panel through which the user can manipulate the solution
// options.
const controlsElement = document.getElementsByClassName('output_canvas')[0];
new ControlPanel(controlsElement, {
        selfieMode: true,
        maxNumHands: 1,
        minDetectionConfidence: 0.8,
        minTrackingConfidence: 0.8
    })
    .add([
        // new StaticText({title: 'MediaPipe Hands'}),
        fpsControl,
        // new Toggle({title: 'Selfie Mode', field: 'selfieMode'}),
        // new Slider(
        //     {title: 'Max Number of Hands', field: 'maxNumHands', range: [1, 4], step: 1}),
        // new Slider({
        //   title: 'Min Detection Confidence',
        //   field: 'minDetectionConfidence',
        //   range: [0, 1],
        //   step: 0.01
        // }),
        // new Slider({
        //   title: 'Min Tracking Confidence',
        //   field: 'minTrackingConfidence',
        //   range: [0, 1],
        //   step: 0.01
        // }),
    ])
//   .on(options => {
//     videoElement.classList.toggle('selfie', options.selfieMode);
//     hands.setOptions(options);
//   });



// this function counts the amount of video inputs
// it replaces DetectRTC that was previously implemented.
function deviceCount() {
    return new Promise(function(resolve) {
        var videoInCount = 0;
        try {
            if (navigator.mediaDevices) {
                navigator.mediaDevices
                    .enumerateDevices()
                    .then(function(devices) {
                        devices.forEach(function(device) {
                            if (device.kind === 'video') {
                                device.kind = 'videoinput';
                            }

                            if (device.kind === 'videoinput') {
                                videoInCount++;
                            }
                        });

                        resolve(videoInCount);
                    })
                    .catch(function(err) {
                        console.log(err.name + ': ' + err.message);
                        resolve(0);
                    });
            } else {
                resolve(0)
            }
        } catch {
            resolve(0)
        }
    });
}
// add event of camera switch if more than cameras found
deviceCount().then(function(deviceCount) {
    var amountOfCameras = deviceCount;
    if (amountOfCameras > 1) {
        var switchCameraButton = document.getElementById('switchCameraButton')
        if (switchCameraButton) {
            // enable switch event()
            switchCameraButton.style.display = 'block';
            switchCameraButton.addEventListener('click', function() {
                camera.switch();
            });
            /// disable fulscreen btn
            var FullscreenButton = document.getElementById("toggleFullScreenButton")
            if (FullscreenButton) FullscreenButton.style.display = 'none';
        }
        // }else{
        //     var gallery = document.getElementById("gallery_images_container")
        //     if (gallery) gallery.classList.toggle('close');
    }
});