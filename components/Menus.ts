/// <reference path="../common/SceneManager.ts" />
/// <reference path="../Utils/Services.ts" />
/// <reference path="Video.ts" />
/// <reference path="Scene.ts" />

declare var s, TweenMax, d3;
module Menus {
    var screenSizeThreshold = 1024;
    var _scene = {
        playable: null,
        hasNext: null,
        hasPrevious: null,
        allowFullscreen: null,
        scene: null
    };
    var ratio = 1.515;
    var videoRatio = 1.778;
    var displayBars = false;
    var screenMode = 'desktop';
    var firstVideoPlayed = false;
    var desktopSVG = null;
    var mobileSVG = null;
    var play = null;
    var playButtonPath = null;
    var back = null;
    var mobileBack = null;
    var mobileNext = null;
    var next = null;
    var fullscreen = null;
    var progressButton = null;
    var progressButtonMobile = null;
    var progressBarDesktop = null;
    var progressBarMobile = null;
    var bigPlay = null;
    var cc = null;
    var mobileCC = null;
    var video = null;
    var app = null;
    var header = null;
    var footer = null;
    var touchable = null;
    var clickTimeout = null;
    var playing = false;
    var bigPlayPath = null;
    var playPath = 'M11,10 L18,13.74 18,22.28 11,26 M18,13.74 L26,18 26,18 18,22.28';
    var pausePath = 'M11,10 L17,10 17,26 11,26 M20,10 L26,10 26,26 20,26';
    var scaleProgressButtonAnim = null;
    var desktopReset = null;
    var frame = null;
    //update scene information
    EventEmitter.on("scene.new", function(evt) {
        var scene = evt.data;
        _scene.hasPrevious = SceneManager.hasPrevious();
        _scene.hasNext = SceneManager.hasNext();
        _scene.allowFullscreen = scene.allowFullscreen;
        _scene.scene = scene;
        if (scene) {
            _scene.playable = scene.playable;
        }
        if (header !== null && footer !== null) {
            header.context.style.display = 'none';
            footer.context.style.display = 'none';
        }
        EventEmitter.emit('updateMenu', null);
    });
    //initilize menu elements
    EventEmitter.on('load', function load(evt) {
        desktopSVG = s('#desktopCtrl').context;
        mobileSVG = s('#mobileCtrl').context;
        play = s('#angle-button-desktop-play');
        back = s('#angle-button-desktop-back');
        mobileBack = s('#angle-button-mobile-back');
        mobileNext = s('#angle-button-mobile-next');
        next = s('#angle-button-desktop-next');
        fullscreen = s('#angle-full-screen').button(true).hide();
        progressButton = s('#angle-progress-bar-desktop-button');
        progressButtonMobile = s('#angle-progress-bar-mobile-button');
        bigPlay = s('.big-play');
        cc = s('#angle-button-desktop-cc').button(true).hide();
        mobileCC = s('#angle-button-mobile-cc').button(true).hide();
        video = s('video').context;
        progressBarDesktop = s('#angle-progress-bar-desktop');
        progressBarMobile = s('#angle-progress-bar-mobile');
        back.listen('onButtonClick', function() { SceneManager.previous() });
        next.listen('onButtonClick', function() { SceneManager.next() });
        mobileBack.listen('onButtonClick', function() { SceneManager.previous() });
        mobileNext.listen('onButtonClick', function() { SceneManager.next() });
        app = document.getElementById('app');
        header = s('.header');
        footer = s('.footer');
        touchable = Services.isTouchDevice();
        bigPlayPath = s('#bigPlayPath');
        playButtonPath = document.querySelectorAll('.desktopPlayPath');
        desktopReset = s('#angle-button-desktop-reset').button(true);
        frame = s('#frame');
        //update button status
        changeButtonStatus();
        containerResize();
        EventEmitter.on('updateMenu', changeButtonStatus);
        EventEmitter.on('resize', containerResize);
        //big play button handler
        if (window.innerWidth <= screenSizeThreshold && touchable) {
            bigPlay.show();
        } else {
            video.removeEventListener('touchstart', menuSwitcher);
        }
        //check if the current scene is a video scene
        if (_scene.playable) {
            SVGRendered();
        }
        document.ontouchmove = function(event) { event.preventDefault(); }
        window.removeEventListener("load", load);
    });

    EventEmitter.on("interactive.loaded", function(e) {
        s('.video').hide();
        playButtonPath[0].setAttribute('d', playPath);
        playButtonPath[1].setAttribute('d', playPath);
        playButtonPath[2].setAttribute('d', playPath);
        play.button(false);
        header.context.style.display = 'block';
        footer.context.style.display = 'block';
        cc.hide();
        mobileCC.hide();
    });

    EventEmitter.on("video.loaded", function(e) {
        s('#frame').hide();
        s('.video').show();
        play.button(true);
        playButtonPath[0].setAttribute('d', pausePath);
        playButtonPath[1].setAttribute('d', pausePath);
        playButtonPath[2].setAttribute('d', pausePath);
        header.context.style.display = 'block';
        footer.context.style.display = 'block';
        if (window.innerWidth <= screenSizeThreshold && touchable && firstVideoPlayed) {
            playVideo();
            bigPlayPath.attr('d', pausePath);
        }
        else if (!touchable) {
            bigPlayPath.attr('d', pausePath);
            playVideo();
        } else {
            header.translate({ x: 0, y: -100 }, 500);
            footer.translate({ x: 0, y: 100 }, 500);
            bigPlayPath.attr('d', playPath);
        }
    });

    //init functions after svg is rendered;
    EventEmitter.on('SVGRendered', function() {
        initButtons();
        initProgressBar();
    });

    EventEmitter.on("video.timeupdate", function(evt) {
        if (evt.data > 99.5) {
            play.button(false);
            d3.select('.desktopPlayPath').transition()
                .duration(300)
                .attr("d", playPath);
        } else {
            play.button(true);
        }
    });

    function containerResize() {
        var finalWidth, ascpectRatio;
        var viewWidth = window.innerWidth;
        var viewHeight = window.innerHeight;
        //window resize check for mobile, change aspectRatio and Events handlers
        if (viewWidth <= screenSizeThreshold) {
            screenMode = "mobile";
            ascpectRatio = videoRatio;
            header.translate({ x: 0, y: -100 }, 500);
            footer.translate({ x: 0, y: 100 }, 500);
            displayBars = false;
            bigPlay.hide();
            if (!touchable) {
                app.addEventListener('mouseenter', showBars);
                app.addEventListener('mouseleave', hideBars);
            }
            if (!firstVideoPlayed && touchable) {
                bigPlay.show();
            }
        } else {
            screenMode = "desktop";
            ascpectRatio = ratio;
            showBars();
            if (!touchable) {
                app.removeEventListener('mouseleave', hideBars);
                app.removeEventListener('mouseenter', showBars);
                bigPlay.hide();
            }
        }
        //container resize
        if (viewWidth / ascpectRatio >= viewHeight) {
            app.style.width = viewHeight * ascpectRatio + 'px';
            app.style.height = viewHeight + 'px';
            app.style.marginTop = '0px';
            finalWidth = viewHeight * ascpectRatio + 'px';
        } else {
            app.style.width = viewWidth + 'px';
            app.style.height = viewWidth / ascpectRatio + 'px';
            app.style.marginTop = (viewHeight - viewWidth / ascpectRatio) / 2 + 'px';
            finalWidth = viewWidth + 'px';
        }
        //set svg width to screen width
        mobileSVG.setAttribute('width', finalWidth);
        desktopSVG.setAttribute('width', finalWidth);
    }

    function hideBars() {
        header.translate({ x: 0, y: -100 }, 500);
        footer.translate({ x: 0, y: 100 }, 500);
        bigPlay.fadeOut(500);
        displayBars = false;
    }

    function showBars() {
        var duration = 10;
        if (window.innerWidth <= screenSizeThreshold) {
            duration = 500;
        }
        header.translate({ x: 0, y: 0 }, duration);
        footer.translate({ x: 0, y: 0 }, duration);
        bigPlay.fadeIn(500);
        displayBars = true;
    }

    function menuSwitcher() {
        if (displayBars) {
            hideBars();
        } else {
            showBars();
        }
    }

    function initProgressBar() {
        //progress bar initializition
        progressBarDesktop.slider('x', 1);
        progressBarMobile.slider('x', 1);
        progressButton.listen('mousedown', progressBarButtonPressed);
        progressButton.listen('touchstart', progressBarButtonPressed);
        progressButtonMobile.listen('mousedown', progressBarButtonPressed);
        progressButtonMobile.listen('touchstart', progressBarButtonPressed);
    }

    function initButtons() {
        //enable events for control buttons
        play.button(true).listen('onButtonClick', function() {
            if (playing) {
                pauseVideo();
            }
            else {
                playVideo();
            }
        });
        cc.listen('onButtonClick', CCSwitcher);
        mobileCC.listen('onButtonClick', CCSwitcher);
        fullscreen.listen('onButtonClick', Scene.controls.onFullScreen);
        bigPlay.listen('touchend', bigButtonHandler);
        bigPlay.listen('mouseup', bigButtonHandler);
        desktopReset.listen('onButtonClick', resetScreen);
    }

    function resetScreen() {
        if (_scene.playable) {
            pauseVideo();
            progressBarDesktop.setToPercentage(0, 0.2);
            progressBarMobile.setToPercentage(0, 0.2);
            video.currentTime = 0;
            setTimeout(playVideo, 500);
        } else {
            frame.context.contentWindow.location.reload();
            frame.listen('load', function load() {
                EventEmitter.emit("interactive.loaded", null);
                this.removeEventListener('load', load);
            });
        }
    }

    function bigButtonHandler(e) {
        e.preventDefault();
        if (!firstVideoPlayed) {
            video.addEventListener('touchstart', menuSwitcher);
            showBars();
        }
        if (playing) {
            d3.select('#bigPlayPath').transition()
                .duration(300)
                .attr("d", playPath);
            pauseVideo();
        } else {
            d3.select('#bigPlayPath').transition()
                .duration(300)
                .attr("d", pausePath);
            playVideo();
        }
    }

    function CCSwitcher() {
        switch (VideoCtrl.isCcVisible()) {
            case true:
                VideoCtrl.closedCaptionsOff();
                break;
            case false:
                VideoCtrl.closedCaptionsOn();
                break;
        }
    }

    function progressBarButtonPressed(e) {
        e.preventDefault();
        TweenMax.killAll();
        pauseVideo();
        scaleProgressButtonAnim = TweenMax.to('#angle-progress-bar-mobile-button', 0.01, { scale: 2, y: -6 });
        //mouseup event handlers
        document.addEventListener('mouseup', function mouseUp(e) {
            e.preventDefault();
            document.removeEventListener('mousemove', setVideoLocation);
            document.removeEventListener('mouseup', mouseUp);
            releaseProgressButton();
        });
        document.addEventListener('touchend', function touchend(e) {
            e.preventDefault();
            document.removeEventListener('touchend', touchend);
            document.removeEventListener('mousemove', setVideoLocation);
            releaseProgressButton();
        });
        //add mousemove event to document which works while the mouse is outside the button
        document.addEventListener('mousemove', setVideoLocation);
    }

    function setVideoLocation(e) {
        if (e) e.preventDefault();
        var progress
        switch (screenMode) {
            case 'desktop':
                progress = progressBarDesktop.attr('result');
                break;
            case 'mobile':
                progress = progressBarMobile.attr('result');
                break;
        }
        if (progress) {
            setProgressButton();
            video.currentTime = video.duration * progress / 100;
            return progress;
        }
        else return 0;
    }

    function releaseProgressButton() {
        TweenMax.to('#angle-progress-bar-mobile-button', 0.35, { scale: 1, y: 0 });
        if (setVideoLocation(null) < 99.9) {
            playVideo();
        } else {
            pauseVideo();
        }
    }

    function setProgressButton() {
        var progress = progressBarDesktop.attr('result');
        var progressMobile = progressBarMobile.attr('result');
        if (!progress) {
            progress = 0;
        }
        if (!progressMobile) {
            progressMobile = 0;
        }
        var move = progress * progressBarDesktop.sliderRange / 100;
        var mobileMove = progressMobile * progressBarMobile.sliderRange / 100;
        progressButton.attr('transform', 'matrix(1, 0, 0, 1, ' + move + ', 0)');
        progressButtonMobile.attr('transform', 'matrix(1, 0, 0, 1, ' + mobileMove + ', 0)');
    }

    function playVideo() {
        d3.select('.desktopPlayPath').transition()
            .duration(300)
            .attr("d", pausePath);
        playButtonPath[1].setAttribute('d', pausePath);
        //Set progress bar animation
        progressBarDesktop.setToPercentage(100, video.duration * (100 - progressBarDesktop.attr('result')) / 100);
        progressBarMobile.setToPercentage(100, video.duration * (100 - progressBarMobile.attr('result')) / 100);
        VideoCtrl.play();
        firstVideoPlayed = true;
        d3.select('#bigPlayPath').transition()
            .duration(300)
            .attr("d", pausePath);
        playing = true;
    }

    function pauseVideo() {
        //Stop progress bar animation
        TweenMax.killAll();
        d3.select('.desktopPlayPath').transition()
            .duration(300)
            .attr("d", playPath);
        playButtonPath[1].setAttribute('d', playPath);
        VideoCtrl.pause();
        d3.select('#bigPlayPath').transition()
            .duration(300)
            .attr("d", playPath);
        playing = false;
    }

    function changeButtonStatus() {
        if (_scene.hasPrevious) {
            back.button(true);
            mobileBack.button(true);
        } else {
            back.button(false);
            mobileBack.button(false);
        }
        if (_scene.hasNext) {
            next.button(true);
            mobileNext.button(true);
        } else {
            next.button(false);
            mobileNext.button(false);
        }
        if (_scene.playable) {
            play.button(true);
            progressBarDesktop.show();
            progressBarMobile.show();
        } else {
            play.button(false);
            progressBarDesktop.hide();
            progressBarMobile.hide();
        }
        if (_scene.allowFullscreen) {
            fullscreen.show();
        } else {
            fullscreen.hide();
        }
    }
    //check if svg is completely loaded, function get called each 10 miliseconds;
    function SVGRendered() {
        if (!desktopSVG || !mobileSVG) {
            return;
        }
        if (mobileSVG.getBoundingClientRect().width === 0 || desktopSVG.getBoundingClientRect().width === 0) {
            setTimeout(SVGRendered, 10);
        }
        else {
            EventEmitter.emit('SVGRendered', null);
        }
    }
}