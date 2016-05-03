/// <reference path="../Utils/Services.ts" />

module Tracker {
    var segments = null;
    var sceneId = null;
    var latestBlock = null;
    var lastTimeUpdate = 0;

    //Whenever a new scene is loaded we check if it is a video and load its data
    EventEmitter.on("scene.new", function(scene) {
        if (!scene.playable) {
            sceneId = null;
            segments = null;
            latestBlock = null;
            lastTimeUpdate = 0;
            return;
        }
        sceneId = scene.sceneId;
        segments = scorm.getPlayedSegments(sceneId);
        if (segments === null || typeof segments === 'undefined') {
            segments = [];
        }
    });

    //keep track of last time update for skip location
    EventEmitter.on("video.timeupdate", function(currentTimePercent) {
        if (sceneId !== null)
            lastTimeUpdate = currentTimePercent;
    });

    EventEmitter.on("scene.willSkip", function(scene) {
        if (sceneId !== null)
            markEnd(lastTimeUpdate);
    });

    EventEmitter.on("video.play", function(atTime) {
        if (sceneId !== null)
            markStart(atTime);
    });

    EventEmitter.on("video.pause", function(atTime) {
        if (sceneId !== null)
            markEnd(atTime);
    });

    function markStart(playLocation) {
        // console.log("markStart at "+playLocation);
        latestBlock = {};
        latestBlock.start = playLocation;
        insertBlock(segments, latestBlock);
    }

    function markEnd(playLocation) {
        // console.log("markEnd at "+playLocation);
        if (latestBlock === null)
            return;
        latestBlock.end = playLocation;
        scorm.savePlayedSegments(sceneId, segments);
        // console.log("percentage played: "+percentPlayed(segments));
    }

    function insertBlock(ranges, block) {
        for (var i = 0; i < ranges.length; i++) {
            if (block.start < ranges[i].start) {
                ranges.splice(i, 0, block);
                return;
            }
        }
        ranges.push(block);
    }

    function percentPlayed(ranges) {
        var total = 0;
        var lastBlock = null;
        for (var i = 0; i < ranges.length; i++) {
            var next = ranges[i];
            if (lastBlock === null) {
                total = next.end - next.start;
                lastBlock = next;
            } else {
                total = newTotal(total, lastBlock, next);
            }
        }
        return Math.min(100, total);
    }

    function newTotal(currentTotal, lastBlock, newBlock) {
        if (newBlock.start >= lastBlock.end) {
            return currentTotal + (newBlock.end - newBlock.start);
        } else if (newBlock.end > lastBlock.end) {
            return currentTotal + (newBlock.end - lastBlock.end);
        }
        return currentTotal;
    }
}