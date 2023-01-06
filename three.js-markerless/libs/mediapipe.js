console.log("using... mediapip verion: ", window.VERSION)


const canvas_cont = document.getElementsByClassName('input_video')[0];
var width = canvas_cont.offsetWidth;
var height = canvas_cont.offsetHeight;

const fpsControl = new FPS();

var FIRST_LOAD_DONE = false;
var selfieMode = 1;
var isProcessing = false
var capturingMode = false
var drawLandMark = false;
let filesLoaded = [];


function postMessageToWebView(...args) {
    // console.log(args)
    /// post messages to webview
    try {
        if (window.ReactNativeWebView)
            window.ReactNativeWebView.postMessage(...args);
        console.log("post message..", ...args)
    } catch (e) {
        console.error("errror in post message; to webview ", e);
    }
}

window.onerror = function(message, file, line, column, errorObj) {
    if (errorObj !== undefined) {
        postMessageToWebView(JSON.stringify({
            "event": "error",
            "error_msg": message,
            "stack": errorObj.stack
        }))
    } else {
        console.error("error.. captured", errorObj);
    }
}

/// being called in hands_solution assets loader..
function updateLoader(percentage) {
    per_loader = document.getElementById("loading_percentage")
    if (per_loader) {
        per_loader.innerHTML = percentage.toString() + "%";
        if (percentage == 100)
            setTimeout(function() {
                per_loader.innerHTML = "Processing."
            }, 1000)
    }
}

const config = {
    locateFile: (file) => {
        if (!filesLoaded.includes(file)) {
            console.log("loading..", file);
            return `${libs}hands/${file}`;
        } else {
            console.log("already loaded...", file)
        }
    }
}

var options = {
    selfieMode: selfieMode,
    maxNumHands: 1,
    drawLandMark: drawLandMark,
    modelComplexity: 1,
    minDetectionConfidence: 0.9,
    minTrackingConfidence: 0.9,
}


// move these also over cdn.
var libs = './libs/';
var img_url = "https://d3rodw1h7g0i9b.cloudfront.net/realtime-tryon-images/"
var static_img_url = "https://d3d5st4bexye3p.cloudfront.net/tryonhandimages/"
// img_url = "./libs/images/"
var img_sku = "default"

var PIX_RATIO = 1; // increase resolution...: may be quit slow.
width = width * PIX_RATIO;
height = height * PIX_RATIO;

const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const snapCanvasElement = document.getElementsByClassName('snap_output_canvas')[0];

canvasElement.width = width;
canvasElement.height = height;
let canvasCtx = canvasElement.getContext('2d');

var fps_elem = document.getElementById('fps_count');
var hand_elem = document.getElementById('hand_elem');
const spinner = document.querySelector('.loading');

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
var front_face_url = get('front-face')

function roundOflandmarks(landmarks) {
    ls = []
    for (var l of landmarks) {
        l.x = roundOf(l.x)
        l.y = roundOf(l.y)
        l.z = roundOf(l.z)
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

// control camer fps ..

function throttleCameraFps(fps) {
    fps = Math.min(fps, 30)
    fps = Math.max(fps, 2)
    camera.applyConstraints({
        frameRate: fps
    })
}

/// draw ring on canvas..
function drawRing(context, landmarks, label, m = 1) {
    // need to optimize this function..
    // var context = canvas.getContext('2d')
    var ringWidth = getDistance(landmarks[13], landmarks[9])
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
        context.translate(ringLoc.x * width * m, ringLoc.y * height * m)
        var isHandUP = up > 0
        var isHandFrontal = front < 0
        if (label === 'Left') isHandFrontal = !isHandFrontal;

        var ringFace = 1 // back face : default
        if (isHandFrontal) ringFace = 0 // set it front if front face
        if (!isHandUP) ringFace = 1 - ringFace // toggle if hand tilted to down.

        var aspect_ratio = images[ringFace].width / images[ringFace].height
        var h = ringWidth / aspect_ratio // coresponding..height..
        context.rotate(((ringRotationX + 90) * Math.PI) / 180)
        console.log(images[ringFace].src)
        context.drawImage(images[ringFace], ringLoc.x - ringWidth / 2, ringLoc.y - h / 2, ringWidth, h)
        context.restore()
    }
}

let snap_canvas_ctx = null;

function onResults(results) {
    // console.log("running..", capturingMode, isProcessing)
    // console.log(isProcessing, capturingMode, )
    if (selfieMode) {
        if (snapCanvasElement.classList.contains("mirror1")) canvasElement.classList.remove("mirror1")
        if (canvasElement.classList.contains("mirror1")) canvasElement.classList.remove("mirror1")
        // if (!videoElement.classList.contains("mirror1")) videoElement.classList.add("mirror1")
    } else {
        if (!snapCanvasElement.classList.contains("mirror1")) canvasElement.classList.add("mirror1")
        if (!canvasElement.classList.contains("mirror1")) canvasElement.classList.add("mirror1")
    }
    if (capturingMode && !isProcessing) {
        if (!isProcessing) {
            // send a single frame/image to hands object for better accuracy..
            startCapturing();
            // camera.stop()
            console.log("camera stopped.")
            isProcessing = true
        }
        // console.log(uax)
        return
    }
    if (capturingMode && isProcessing) {
        isProcessing = true;
    }
    // multiplier
    m = isProcessing === true ? 1 : 1;
    fpsControl.tick();
    let canvasEl = (isProcessing === true && snapCanvasElement != null) ? snapCanvasElement : canvasElement;
    width = canvas_cont.offsetWidth;
    height = canvas_cont.offsetHeight;
    canvasEl.width = width * m;
    canvasEl.height = height * m;
    canvasCtx = canvasEl.getContext('2d');

    if (isCanvasBlank(canvasEl)) {
        return
    }
    if (!isProcessing) {
        if (!FIRST_LOAD_DONE) {
            FIRST_LOAD_DONE = true;
            postMessageToWebView(JSON.stringify({
                "loading": false,
                "event": 'realtime_loading'
            }))
        }
        spinner.style.display = 'none';
        videoElement.style.disable = 'none';
    }
    fps_elem.innerHTML = fpsControl.h.outerHTML;
    // var fpsValues = fpsControl.g
    // console.log("orig fps", fpsControl.i, fpsControl)
    // throttleCameraFps(fpsControl.i+5);
    // throttleCameraFps(fpsControl.g[fpsControl.g.length -1]+5);

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, width * m, height * m);
    canvasCtx.drawImage(results.image, 0, 0, width * m, height * m);


    // var canvas = document.getElementById('video')
    var canvas = results.image
    if (canvas) {
        var hand_html = '';
        if (results.multiHandLandmarks) {
            var i = 0;
            for (const landmarks of results.multiHandLandmarks) {
                // landmarks = roundOflandmarks(landmarks)
                // console.log("...",landmarks[13])
                if (drawLandMark) {
                    drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
                        color: '#00FF00',
                        lineWidth: 5
                    });
                    drawLandmarks(canvasCtx, landmarks, {
                        color: '#FF0000',
                        lineWidth: 2
                    });
                }
                drawRing(canvasCtx, landmarks, results.multiHandedness[i].label, m);
                i += 1;
            }
            var hand_html = '';
            for (const hand of results.multiHandedness) {
                hand_html += hand.label + " (" + Math.floor(hand.score * 100, 3) + "% ) <br/>"
            }
        }
    }
    hand_elem.innerHTML = hand_html;
    canvasCtx.restore();
    if (isProcessing) {
        snap_canvas_ctx = canvasCtx;
        return canvasCtx;
    }
}

function isCanvasBlank(canvas) {
    const context = canvas.getContext('2d');
    // console.log(context.getImageData(0, 0, 10, 10))
    const pixelBuffer = new Uint32Array(
        context.getImageData(0, 0, 5, 5).data.buffer
    );
    isBlank = pixelBuffer.some(color => color !== 0);
    return isBlank
    // return false;
}

const hands = new Hands(config);
hands.setOptions(options);


// pre-load images.. to avoid loading.. delay..
async function f() {
    var imgPathf =  ('./img/r4b.png');

    var imgObjf = new Image()
    imgObjf.crossOrigin = "anonymous"
    imgObjf.src = imgPathf

    var imgObjb = new Image()

    if (front_face_url) {
        var imgPathb = `${static_img_url}${front_face_url}`;
    } else {
        var imgPathb =  ('./img/r4.png')
    }
    imgObjb.crossOrigin = "anonymous"
    imgObjb.src = imgPathb

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

/// configure camera, attach hands object to onframe callback
const camera = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({
            image: videoElement
        })
    },
    width: width / PIX_RATIO,
    height: height / PIX_RATIO,
})


// start camera, and processing..
camera.start()


// console.log(sadas)
// add a warning for below ios 15 ..
if (window.IOS_VERSION && window.IOS_VERSION < 15) {
    alert('This is running below ios 15, performance will be slow.....', window.IOS_VERSION.toString());
}


// Present a control panel through which the user can manipulate the solution
// options.
const controlsElement = document.getElementsByClassName('control-panel')[0];
new ControlPanel(
        controlsElement, options
    ).add([
        new StaticText({
            title: 'Ornaz RealTime TRY-ON'
        }),
        fpsControl,
        new Toggle({
            title: 'Selfie Mode',
            field: 'selfieMode'
        }),
        new Slider({
            title: 'Model Complexity',
            field: 'modelComplexity',
            range: [0, 1],
            step: 1
        }),
        new Toggle({
            title: 'Show Landmark',
            field: 'drawLandMark'
        }),
        new Slider({
            title: 'Max Number of Hands',
            field: 'maxNumHands',
            range: [1, 4],
            step: 1
        }),
        new Slider({
            title: 'Min Detection Confidence',
            field: 'minDetectionConfidence',
            range: [0, 1],
            step: 0.01
        }),
        new Slider({
            title: 'Min Tracking Confidence',
            field: 'minTrackingConfidence',
            range: [0, 1],
            step: 0.01
        }),
    ])
    .on(options => {
        selfieMode = options.selfieMode;
        options = options;
        videoElement.classList.toggle('selfie', options.selfieMode);
        drawLandMark = options.drawLandMark;
        hands.setOptions(options);
    });


// add event of camera switch if more than cameras found
var switchCameraButton = document.getElementById('switchCameraButton')
if (switchCameraButton) {
    switchCameraButton.addEventListener('click', function() {
        spinner.style.display = "flex";
        camera.switch().then(
            () => {
                // var canvas_outputElem = document.getElementById('video')
                // if (canvas_outputElem)
                //     canvas_outputElem.classList.toggle('mirror1') 
                selfieMode = Boolean(camera.b.facingMode == "user");
                if (!selfieMode) {
                    document.getElementsByClassName("control-panel-toggle")[0].classList.replace("yes", "no")
                } else {
                    document.getElementsByClassName("control-panel-toggle")[0].classList.replace("no", "yes")
                }
                postMessageToWebView(JSON.stringify({
                    "facingMode": camera.b.facingMode,
                    "event": 'camera_switch'
                }))
            }
        );
    });
}

// adding toggle feature in controller,
const controller = document.querySelector(".control-panel-entry.control-panel-text")
if (controller) {
    controller.addEventListener("click", function() {
        document.querySelectorAll('.control-panel-entry').forEach(function(el) {
            el.classList.toggle("hide")
        });
        controller.classList.toggle("hide")
    });
    controller.click()
}

// toggle Flash action ..
var Flash = false
const flashButton = document.getElementById('switch_flash')
if (flashButton) {
    flashButton.addEventListener('click', function() {
        Flash = !Flash;
        camera.toggleFlash(Flash);
    })
}


// add capture button action ..
const captureButton = document.getElementById('takePhotoButton')
if (captureButton) {
    captureButton.addEventListener('click', function() {
        capturingMode = true
        spinner.style.display = 'flex';
    })
}
// startCapturing function
function startCapturing() {

    let SNAP_PIX_RAIO = 1; // manipulate canvas object size..
    // console.log(uas)
    let curr_canvas = document.querySelector('canvas#snap_output_canvas');
    let video = document.querySelector('video');

    curr_canvas.width = width * PIX_RATIO * SNAP_PIX_RAIO;
    curr_canvas.height = height * PIX_RATIO * SNAP_PIX_RAIO;
    let snap_context = curr_canvas.getContext('2d');

    // get video snapshot into canvas object
    snap_context.drawImage(video, 0, 0, curr_canvas.width, curr_canvas.height);
    throttleCameraFps(0)
    spinner.style.disable = "flex";
    // send proper canvas image as input in hands object
    function getCanvasBlob(curr_canvas) {
        return new Promise(function(resolve, reject) {
            hands.send({
                    'image': curr_canvas /* HTMLCanvasElement */
                })
                .then(
                    function() {
                        throttleCameraFps(100)
                        isProcessing = false;
                        capturingMode = false;
                        // spinner.style.display = 'none';
                        resolve(snap_canvas_ctx);
                    }
                )
        });
    }

    // snap_canvas_ctx  object can be manipulated with like filter, alpha, etc.. as canvas... objects..
    function getBeutifiedCanvas(canvas_ctx) {
        return canvas_ctx.canvas
    }

    // some API's (like Azure Custom Vision) need a blob with image data
    getCanvasBlob(curr_canvas).then(function(snap_canvas_ctx) {
        let snap_canvas = getBeutifiedCanvas(snap_canvas_ctx)
        if (!snap_canvas) return;
        var img = snap_canvas.toDataURL("image/png");
        var galleryHtml = document.getElementById('gallery_images').innerHTML
        if (options.selfieMode == 0) {
            document.getElementById('gallery_images').innerHTML = '<img class="mirror" src="' + img + '"/>' + galleryHtml;
        } else {
            document.getElementById('gallery_images').innerHTML = '<img src="' + img + '"/>' + galleryHtml;
        }
        postMessageToWebView(JSON.stringify({
            "photo": img,
            "event": 'realtime_snap'
        }))
    });

}