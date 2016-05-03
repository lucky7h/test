/// <reference path='../Utils/Load_json.ts' />
/// <reference path='../common/SceneManager.ts' />
/// <reference path='../Utils/Services.ts' />

declare var s;
interface HTMLElement {
    msRequestFullscreen: any,
    mozRequestFullScreen: any
}
interface Document {
    mozCancelFullScreen: any,
    msExitFullscreen: any
}
module VideoCtrl {
    var video = null;
    var advanceToLocation = 0;
    var playWhenAdvanced = false;
    var closeCaptions = false;
    var videopath = null;
    var scene;
    var _instance = {
        video: null,
        bookmark: -1
    }
    //initilize video wrapper
    EventEmitter.on('load', function load() {
        initialize();
        window.removeEventListener('load', load);
    });
    //Whenever a new scene is loaded, change the video url if it is a video
    EventEmitter.on('scene.loaded', function(evt) {
        scene = evt.data;
        if (scene.playable) {
            videopath = scene.videoPath;
            EventEmitter.emit('video.changed', videopath);
        }
        if (video) {
            video.pause();
        }
    });

    function initialize() {
        var domVideo = document.querySelector('video');
        if (typeof domVideo === 'undefined' || domVideo === null) throw new Error('Video must be defined');
        video = domVideo;
        s('video source').context.src = videopath + '.mp4';
        video.addEventListener('loadedmetadata', function() {
            EventEmitter.emit('video.loaded', scene);
            if (scene.CC) {
                s('#angle-button-desktop-cc').show();
                s('#angle-button-mobile-cc').show();
                var oldTrack = document.querySelector('video track');
                if (oldTrack) {
                    oldTrack.parentNode.removeChild(oldTrack);
                }
                var track = document.createElement('track');
                track.kind = 'captions';
                track.label = 'English';
                track.srclang = 'en';
                track.src = videopath + '.vtt';
                s('video').context.appendChild(track);
                track.addEventListener('load', function load() {
                    displayCC();
                    this.removeEventListener('load', load);
                });
                //for IE, display the cc depends on the cc status each time when video is loaded.
                // if (track) {
                //     displayCC();
                // }
            } else {
                s('#angle-button-desktop-cc').hide();
                s('#angle-button-mobile-cc').hide();
            }
            function displayCC() {
                if (closeCaptions) {
                    this.mode = 'showing';
                    video.textTracks[0].mode = 'showing';
                } else {
                    this.mode = 'hidden';
                    video.textTracks[0].mode = 'hidden';
                }
            }
        });
        video.addEventListener('ended', function() {
            EventEmitter.emit('video.ended', null);
        });
        video.addEventListener('pause', function() {
            EventEmitter.emit('video.pause', percentLocation(video));
        });
        video.addEventListener('timeupdate', function() {
            EventEmitter.emit('video.timeupdate', percentLocation(video));
        });
        if (_instance.bookmark !== -1) {
            trackToLocation(_instance.bookmark, true);
            _instance.bookmark = -1;
        }
        video.load();
    }

    export function play() {
        if (video !== null) {
            video.play();
        }
    }

    export function pause() {
        if (video !== null)
            video.pause();
    }

    export function playing() {
        return video === null ? false : !video.paused;
    }

    export function duration() {
        return video.duration;
    }

    export function maximize() {
        var frame = document.body;
        if (frame.requestFullscreen) {
            frame.requestFullscreen();
        }
        else if (frame.webkitRequestFullScreen) {
            frame.webkitRequestFullScreen();
        }
        else if (frame.mozRequestFullScreen) {
            frame.mozRequestFullScreen();
        }
        else if (frame.msRequestFullscreen) {
            frame.msRequestFullscreen();
        }
        else {
            alert('Fullscreen API is not supported.');
        }
    }

    export function minimize() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
        else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
        else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        }
        else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }

    export function closedCaptionsOff() {
        video.textTracks[0].mode = 'hidden';
        closeCaptions = false;
    }

    export function closedCaptionsOn() {
        video.textTracks[0].mode = 'showing';
        closeCaptions = true;
    }

    export function isCcVisible() {
        return closeCaptions;
    }

    function trackToLocation(locationPercent, andPlay) {
        andPlay = (typeof andPlay === 'undefined') ? false : andPlay;
        if (isNaN(video.duration)) {
            // wait until we know duration
            advanceToLocation = locationPercent;
            playWhenAdvanced = andPlay;
            video.addEventListener('loadedmetadata', onMetadataLoaded, false);
        } else {
            playFromLocation(locationFromPercent(video, locationPercent), andPlay);
        }
    }

    function onMetadataLoaded() {
        video.removeEventListener('loadedmetadata', onMetadataLoaded, false);
        playFromLocation(locationFromPercent(video, advanceToLocation), playWhenAdvanced);
    }

    function playFromLocation(location, andPlay) {
        video.currentTime = location;
        var play = (typeof andPlay === 'undefined') ? false : andPlay;
        if (play && video.paused) {
            video.play();
        }
    }

    function percentLocation(vid) {
        return 100 * (vid.currentTime / vid.duration);
    }

    function locationFromPercent(vid, percent) {
        return percent * vid.duration / 100;
    }
}
