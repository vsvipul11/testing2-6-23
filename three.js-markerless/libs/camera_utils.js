(function() {
    /*

     Copyright The Closure Library Authors.
     SPDX-License-Identifier: Apache-2.0
    */
    'use strict';
    var deviceCount = null
    var e = "function" == typeof Object.defineProperties ? Object.defineProperty : function(a, b, c) {
        if (a == Array.prototype || a == Object.prototype) return a;
        a[b] = c.value;
        return a
    };

    function f(a) {
        a = ["object" == typeof globalThis && globalThis, a, "object" == typeof window && window, "object" == typeof self && self, "object" == typeof global && global];
        for (var b = 0; b < a.length; ++b) {
            var c = a[b];
            if (c && c.Math == Math) return c
        }
        throw Error("Cannot find global object");
    }
    var h = f(this);

    function k(a, b) {
        if (b) a: {
            var c = h;a = a.split(".");
            for (var d = 0; d < a.length - 1; d++) {
                var g = a[d];
                if (!(g in c)) break a;
                c = c[g]
            }
            a = a[a.length - 1];d = c[a];b = b(d);b != d && null != b && e(c, a, {
                configurable: !0,
                writable: !0,
                value: b
            })
        }
    }
    var l = "function" == typeof Object.assign ? Object.assign : function(a, b) {
        for (var c = 1; c < arguments.length; c++) {
            var d = arguments[c];
            if (d)
                for (var g in d) Object.prototype.hasOwnProperty.call(d, g) && (a[g] = d[g])
        }
        return a
    };
    k("Object.assign", function(a) {
        return a || l
    });
    var m = this || self;
    var n = {
        facingMode: "user",
        width: 640,
        height: 480
    };

    function p(a, b) {
        this.video = a;
        this.a = 0;
        this.b = Object.assign(Object.assign({}, n), b)
    }

    function q(a) {
        window.requestAnimationFrame(function() {
            r(a)
        })
    }

    function t(a, b) {
        a.video.srcObject = b;
        a.video.onloadedmetadata = function() {
            a.video.play();
            q(a)
        }
    }

    function r(a) {
        var b = null;
        a.video.paused || a.video.currentTime === a.a || (a.a = a.video.currentTime, b = a.b.onFrame());
        b ? b.then(function() {
            q(a)
        }) : q(a)
    }

    function startCallback(a, c) {
        t(a, c)
        checkFlash(c)
        if (deviceCount === null) {
            getVideoDeviceCount().then(function(videoDeviceCount) {
                deviceCount = videoDeviceCount;
                var switchCameraButton = document.getElementById('switchCameraButton')
                if (switchCameraButton && deviceCount > 1) {
                    if (!window.ReactNativeWebView) {
                        switchCameraButton.style.display = 'block';
                    }
                    var FullscreenButton = document.getElementById("toggleFullScreenButton")
                    if (FullscreenButton) FullscreenButton.style.display = 'none';
                }
                if (deviceCount == 0)
                    alert("this app needs camera,but camera is not available or accessible.")
            });
        }
    }
    p.prototype.start = function() {
        var a = this;
        // navigator.getWebcam = (navigator.getUserMedia || navigator.mediaDevices.getUserMedia || navigator.webKitGetUserMedia || navigator.moxGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
        navigator.getWebcam = (navigator.mediaDevices.getUserMedia || navigator.webKitGetUserMedia || navigator.moxGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
        navigator.mediaDevices && navigator.mediaDevices.getUserMedia || alert("No navigator.mediaDevices.getUserMedia exists.");
        var b = this.b;
        var config = {
            video: {
                facingMode: b.facingMode,
                width: b.width,
                height: b.height,
                advanced: [{
                    frameRate: 30
                }]
            },
            audio: false,
        };
        if (navigator.mediaDevices) {
            return navigator.mediaDevices.getUserMedia(config).then(function(c) {
                startCallback(a, c)
            }).catch(function(c) {
                console.error("Failed to acquire camera feed: " + c);
                alert("Failed to acquire camera feed: " + c);
                throw c;
            })
        } else {
            navigator.getWebcam(config).then(function(c) {
                startCallback(a, c)
            }).catch(function(c) {
                console.error("Failed to acquire camera feed: " + c);
                alert("Failed to acquire camera feed: " + c);
                throw c;
            })
        }
    };

    function checkFlash(stream) {
        stream.getTracks().forEach(function(track) {
            // if(track.enabled){
            let capabilities = {}
            try {
                capabilities = track.getCapabilities()
                // alert("capabilities: " + JSON.stringify(capabilities));
            } catch (e) {
                console.error(e)
            }
            const constraints = track.getConstraints()
            if (capabilities.torch) {
                var flashButton = document.getElementById('switch_flash')
                if (flashButton) {
                    flashButton.classList.remove("hide")
                }
            }
            // })
            // }
        });
    }
    p.prototype.stop = async function() {
        /// stop all stram connected tyo this video object
        var stream = this.video.srcObject;
        if (stream) {
            stream.getTracks().forEach(function(track) {
                //   console.log(track);
                track.stop();
            });
        }
    }
    p.prototype.applyConstraints = function(data) {
        if (!this.video) {
            console.log("video not found..")
            return -1
        }
        /// stop all stram connected tyo this video object
        var stream = this.video.srcObject;
        if (stream && stream.active) {
            stream.getTracks().forEach(function(track) {
                //   console.log(track);
                track.applyConstraints({
                    advanced: [data]
                });
            });
        }
    }
    async function getVideoDeviceCount() {
        // return new Promise(function(resolve) {resolve(2)});
        return new Promise(function(resolve) {
            var videoInCount = 0;
            try {
                if (navigator.mediaDevices) {
                    navigator.mediaDevices
                        .enumerateDevices()
                        .then(function(devices) {
                            devices.forEach(function(device) {
                                if (device.kind === 'video') device.kind = 'videoinput';
                                if (device.kind === 'videoinput') videoInCount++;
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
            } catch (e) {
                console.error("error in deviceCount", e)
                resolve(0)
            }
        });
    }

    p.prototype.toggleFlash = function(torchEnabled) {
        // toggle flash for camera.
        var stream = this.video.srcObject;

        if (stream) {
            stream.getTracks().forEach(function(track) {
                let constraints = {
                    width: {
                        min: 640,
                        ideal: 1280
                    },
                    height: {
                        min: 480,
                        ideal: 720
                    },
                    advanced: [{
                            width: 1920,
                            height: 1280
                        },
                        {
                            aspectRatio: 1.333
                        }
                    ]
                };
                //   constraints = {  advanced: [{torch: true}]}
                try {
                    track.applyConstraints(constraints);
                } catch (e) {
                    alert(">>> error  in flash lisght, ", JSON.stringify(e))
                }
            });
        }
    }
    p.prototype.pause = function() {
        /// stop all stram connected tyo this video object
        var res = p.prototype.applyConstraints({
            frameRate: 1
        })
        if (res == -1) {
            console.log(">>>>>>> could not freeze camera..", )
        }
    }
    p.prototype.resume = function() {
        /// stop all stram connected tyo this video object
        p.prototype.applyConstraints({
            frameRate: 30
        })
    }
    p.prototype.switch = async function() {
        if (this.b.facingMode === 'environment') {
            this.b.facingMode = 'user';
        } else {
            this.b.facingMode = 'environment';
        }
        this.stop()
        this.start()
    }
    var u = ["Camera"],
        v = m;
    u[0] in v || "undefined" == typeof v.execScript || v.execScript("var " + u[0]);
    for (var w; u.length && (w = u.shift());) u.length || void 0 === p ? v[w] && v[w] !== Object.prototype[w] ? v = v[w] : v = v[w] = {} : v[w] = p;
}).call(this);