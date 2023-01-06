/*

>> kasperkamperman.com - 2018-04-18
>> kasperkamperman.com - 2020-05-17
>> https://www.kasperkamperman.com/blog/camera-template/

*/
var main_url = window.location.href;
console.log("main_url", main_url);
var split_url = main_url.split("?");
var split_url = split_url[1];
function getDeviceType() {
      var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
    
    
      } else {
        window.location.replace(`../../qrcode/?${split_url}`);
        console.log("You are using Desktop");
          }
}
getDeviceType();

async function callApi(body) {
	var slug_url;
	var query = window.location.search.replace("?", "");
	slug_url = query.split("?id=");
	slug_url = `${slug_url}`.replace("id=", "");
	console.log("slug_url", slug_url);
  
	var myHeaders = new Headers();
	myHeaders.append(
	  "Cookie",
	  "AWSALB=avveZ58F2waXKb4NZD8TZs5C+9D1t30UHXviin7HrCN2xUbzbG4tq3YDnZgiNZySnPUdVQeuOrtUfCafzY+fBnXXWu1IqKRGqVcRuSrBglgO6ml8390raScBe/ZL; AWSALBCORS=avveZ58F2waXKb4NZD8TZs5C+9D1t30UHXviin7HrCN2xUbzbG4tq3YDnZgiNZySnPUdVQeuOrtUfCafzY+fBnXXWu1IqKRGqVcRuSrBglgO6ml8390raScBe/ZL"
	);
	var requestOptionsV2 = {
	  method: "GET",
	  headers: {
		myHeaders,
		"Access-Control-Allow-Origin": "*",
	  },
	  redirect: "follow",
	};
	let respV2 = await fetch(
	  "https://api.morkshub.xyz/api/get_node/" + slug_url,
	  requestOptionsV2
	);
  
	let textV2 = await respV2.text();
	let jsonrespV2 = JSON.parse(textV2);
	// console.log("jsonrespV2.data", jsonrespV2.data[0]);
  
	////////////////////////////////////////////////////////////////////
  
	// return jsonresp;
	return jsonrespV2.data;
  } 

  
  async function apiData() {
    const jsonResp = await callApi();
    const experience = jsonResp;
    console.log("experience", experience);

    var gaTag;
    var blocking;
    var expGaTag;
    var expName;
    var exp_type;
    var detection_point;
    var web_url;
    var contentAsset;
    var content;
    var baseUrl = window.location.origin;
    var expUrl;
    
    // var api_texture_value;
    
    var api_texture_value;

    var ApiAssetUrl = "https://vossle-v2.s3.ap-south-1.amazonaws.com/";
    experience.map((exp) => {
      gaTag = exp.user.ga_code;
      blocking = exp.blocking;
      expGaTag = exp.ga_code_exp;
      expName = exp.exp_name;
      

      exp_type = exp.exp_type.exp_type;
      detection_point = exp.detection_point;
      web_url = exp.website;
      contentAsset = exp.assets;

      
      //************** code for url link ********************
      expUrl = baseUrl + "/?id=" + exp.slug_exp_name;
      //************  end code for url link ********************
      
    });


   
    
    console.log(exp_type);
    console.log(detection_point);
    console.log(gaTag);
    // console.log(lat);
    // console.log(long);
    console.log(blocking);
    console.log(expGaTag);
    console.log(expName);
    console.log(web_url);
    console.log("content", content);

    // var gaTag = "G-TWPJ604KRH";
    // **************** code for dynamic gatag *********************
    // console.log('gaTag inside try on', gaTag)
    var gaTagele = document.getElementById("gaTagTryOn");
    var exGaTagele = document.getElementById("exGaTag");
    var gaTagUrl = `https://www.googletagmanager.com/gtag/js?id=${gaTag}`;
    var exGaTagUrl = `https://www.googletagmanager.com/gtag/js?id=${expGaTag}`;
    // for users
    gaTagele.setAttribute("src", gaTagUrl);
    function gtag2() {
      dataLayer.push(arguments);
    }
    gtag2("js", new Date());
    gtag2("config", gaTag);
    //  for experience
    if (expGaTag !== null) {
      exGaTagele.setAttribute("src", exGaTagUrl);
      gtag2("config", expGaTag);
    }
    // **************** end code for dynamic gatag *********************

    // ************ code for blocking experience ***********
    // if(blocking == 'Block')
    // {
    //   document.getElementById('blockingDiv').style.display = "block"
    //   document.getElementById("markerless-loader").style.display = 'none'
    // }
    // ************end code for blocking experience ***********

    // get experience name data on html
    document.getElementById("name").innerHTML = expName;
    if (web_url == null || web_url == "") {
      web_url = "vossle.com";
    }
    // get api data on info button
    console.log("web_url", web_url);
    if (!web_url.match(/^https?:\/\//i)) {
      // info button listner
      var website = "http://" + web_url;
      console.log("website", website);
      document.getElementById("info-btn").onclick = function () {
        var windowSize =
          "width=" +
          window.innerWidth +
          ",height=" +
          window.innerHeight +
          ",scrollbars=no";
        window.open(`${website}`, "popup", windowSize);
        console.log("info button running in finction", website);
      };
    } else {
      document.getElementById("info-btn").onclick = function () {
        var windowSize =
          "width=" +
          window.innerWidth +
          ",height=" +
          window.innerHeight +
          ",scrollbars=no";
        window.open(`${website}`, "popup", windowSize);
        console.log("info button running in finction", website);
      };
    }
    //  end info buttom listner

    // get html  share button
    var linkshare = document.getElementById("url_share");
    console.log("linksshare", linkshare);
    linkshare.addEventListener("click", function () {
      shareButtonApiCount();
      share();
    });
    //end get html  share button

    function share() {
      if (navigator.share) {
        navigator
          .share({
            title: "Share this link to :",
            // url: experience.url,
            url: expUrl,
          })
          .then(() => {
            console.log("Thanks for sharing!");
          })
          .catch(console.error);
      } else {
        shareDialog.classList.add("is-open");
      }
 
    }
 return api_texture_value;   
}

apiData();
  

  // Url Share api count
  async function shareButtonApiCount() {
    const currentUlr = window.location.href;
    console.log("currentUtl", currentUlr);
    const [label, value] = currentUlr.split("=");
    console.log("after split value =", value);
    console.log("after split label =", label);
    var formdata = new FormData();
    formdata.append("id", value);
    var requestOptions = {
      method: "POST",
      body: formdata,
      redirect: "follow",
    };

    fetch("https://api.vossle.com/ARexperience/share_count", requestOptions)
      .then((response) => response.text())
      .then((result) => console.log("sharebutton", result))
      .catch((error) => console.log("error", error));
  }


  // end of Url Share api count



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