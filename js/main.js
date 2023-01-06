/*

>> kasperkamperman.com - 2018-04-18
>> kasperkamperman.com - 2020-05-17
>> https://www.kasperkamperman.com/blog/camera-template/

*/


var takeSnapshotUI = createClickFeedbackUI();

var video;
var takePhotoButton;
var toggleFullScreenButton;


document.addEventListener('DOMContentLoaded', function(event) {
    initCameraUI();
    toggleControls();
});


function toggleGallery() {
    galleryButton = document.getElementById('galleryButton');
    gallery = document.getElementById('gallery_images_container');
    gallery.classList.toggle('close')
    if (galleryButton.getAttribute('aria-pressed') == 'true') {
        galleryButton.setAttribute('aria-pressed', false);
    } else {
        galleryButton.setAttribute('aria-pressed', true);
    }
    if (gallery.style.display == 'none') {
        gallery.style.display = 'block';
    }
}

function initCameraUI() {

    video = document.getElementById('video');

    takePhotoButton = document.getElementById('takePhotoButton');
    toggleFullScreenButton = document.getElementById('toggleFullScreenButton');
    switchCameraButton = document.getElementById('switchCameraButton');
    galleryButton = document.getElementById('galleryButton');
    hideGallery = document.getElementById('hideGallery');

    if (galleryButton) {
        galleryButton.addEventListener('click', function() {
            toggleGallery();
        })
    }
    if (hideGallery) {
        hideGallery.addEventListener('click', function() {
            toggleGallery()
        })
    }
    // https://developer.mozilla.org/nl/docs/Web/HTML/Element/button
    // https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Techniques/Using_the_button_role

    takePhotoButton.addEventListener('click', function() {
        // toggleLoader();
        takeSnapshotUI();
        takeSnapshot()
        // toggleLoader();
    });

    // -- fullscreen part

    function fullScreenChange() {
        if (screenfull.isFullscreen) {
            toggleFullScreenButton.setAttribute('aria-pressed', true);
        } else {
            toggleFullScreenButton.setAttribute('aria-pressed', false);
        }
    }

    if (screenfull.isEnabled) {
        screenfull.on('change', fullScreenChange);

        // toggleFullScreenButton.style.display = 'block';

        // set init values
        fullScreenChange();

        toggleFullScreenButton.addEventListener('click', function() {
            screenfull.toggle(document.getElementById('container')).then(function() {
                console.log(
                    'Fullscreen mode: ' +
                    (screenfull.isFullscreen ? 'enabled' : 'disabled'),
                );
            });
        });
    } else {
        console.log("iOS doesn't support fullscreen (yet)");
    }

    var base = document.querySelector('#gallery_images'); // the container for the variable content
    var selector = 'img'; // any css selector for children
    base.addEventListener('click', function(event) {
        // find the closest parent of the event target that
        // matches the selector
        var closest = event.target.closest(selector);
        if (closest && base.contains(closest)) {
            overlayContainer = document.getElementById('overlay-container')
            overlay = document.getElementById('overlay');
            overlay.innerHTML = closest.outerHTML;
            overlayContainer.style.display = 'block';
            // console.log(closest);
            // handle class event
        }
    });

    var overlayClose = document.getElementById('overlay-close')
    overlayClose.addEventListener('click', function() {
        document.getElementById('overlay-container').style.display = 'none';
    });
    // Listen for orientation changes to make sure buttons stay at the side of the
    // physical (and virtual) buttons (opposite of camera) most of the layout change is done by CSS media queries
    // https://www.sitepoint.com/introducing-screen-orientation-api/
    // https://developer.mozilla.org/en-US/docs/Web/API/Screen/orientation
    window.addEventListener(
        'orientationchange',
        function() {
            // restart mediapipe stream..
            // iOS doesn't have screen.orientation, so fallback to window.orientation.
            // screen.orientation will
            // you can also rotate video to feel it real..
            if (screen.orientation) angle = screen.orientation.angle;
            else angle = window.orientation;

            var guiControls = document.getElementById('gui_controls').classList;
            var vidContainer = document.getElementById('vid_container').classList;

            if (angle == 270 || angle == -90) {
                guiControls.add('left');
                vidContainer.add('left');
            } else {
                if (guiControls.contains('left')) guiControls.remove('left');
                if (vidContainer.contains('left')) vidContainer.remove('left');
            }

            //0   portrait-primary
            //180 portrait-secondary device is down under
            //90  landscape-primary  buttons at the right
            //270 landscape-secondary buttons at the left
        },
        false,
    );
}


function takeSnapshot() {
    var canvas = document.getElementById('video');
    // polyfil if needed https://github.com/blueimp/JavaScript-Canvas-to-Blob

    // https://developers.google.com/web/fundamentals/primers/promises
    // https://stackoverflow.com/questions/42458849/access-blob-value-outside-of-canvas-toblob-async-function
    function getCanvasBlob(canvas) {
        return new Promise(function(resolve, reject) {
            resolve(canvas);
            // canvas.toBlob(function (blob) {
            //   resolve(blob);
            // }, 'image/jpeg');
        });
    }

    // function appendImage(canvas){
    //   return new Promise(function(){
    //     var img    = canvas.toDataURL("image/png");
    //     document.getElementById('gallery_images').innerHTML += '<img src="'+img+'"/>';
    //   })
    // }
    // some API's (like Azure Custom Vision) need a blob with image data
    getCanvasBlob(canvas).then(function(canvas) {
        var img = canvas.toDataURL("image/png");
        document.getElementById('gallery_images').innerHTML += '<img src="' + img + '"/>';
    });
}

function createClickFeedbackUI() {
    var overlay = document.getElementById('video_overlay'); //.style.display;
  
    var overlayVisibility = false;
    var timeOut = 80;

    function setFalseAgain() {
        overlayVisibility = false;
        overlay.style.display = 'none';
    }

    return function() {
        if (overlayVisibility == false) {
            overlayVisibility = true;
            overlay.style.display = 'block';
            setTimeout(setFalseAgain, timeOut);
        }
    };
}

function toggleLoader() {
    var loader = document.getElementById('loader');
    if (loader) {
        if (loader.style.display == 'none') {
            loader.style.display = 'flex';
        } else {
            loader.style.display = 'none';
        }
    }
}

function toggleControls() {
    var controls = document.getElementById('gui_controls');
    if (controls) {
        controls.style.display = (controls.style.display == 'none') ? 'block' : 'none';
    }
}

// registering  service worker..
let isLocal = (location.hostname === "localhost" || location.hostname === "127.0.0.1" || location.hostname === "");

if ('serviceWorker' in navigator && !isLocal) {
    navigator.serviceWorker
        .register('./service-worker.js', {
            scope: './'
        })
        .then(function(registration) {
            console.log("Service Worker Registered");
        })
        .catch(function(err) {
            console.log("Service Worker Failed to Register", err);
        })

}