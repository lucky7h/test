/// <reference path="Player.ts" />
/// <reference path="../Utils/Load_json.ts" />
/// <reference path="../components/Scene.ts" />
/// <reference path="../Utils/Services.ts" />

interface Window {
    player: any
}
module SceneManager {
    var config = Load.config;
    var scormPlayer = Player.scormPlayer;
    var _sceneIndex = -1;
    var scenes = null;
    var nextButtonEnabled = true;
    var backButtonEnabled = true;

    export function initialize(sceneArray) {
        if (typeof sceneArray === 'undefined')
            throw new Error("Scene array must be defined");
        if (sceneArray === null)
            throw new Error("Scene array cannot be null");
        if (!(sceneArray instanceof Array))
            throw new Error("Scene array should be an array");
        scenes = [];
        for (var i = 0; i < sceneArray.length; i++) {
            scenes.push(Scene.create(sceneArray[i]));
        }
        registerForEvents();
        _setScene(config.initialIndex);
        publishSelf();
    }

    export function publishSelf() {
        //Whenever an interactive scene is loaded, register the scene manager if needed
        EventEmitter.on("interactive.loaded", function(evt) {
            var iframe = s('#frame').context;
            // Allow access to some scene manager functions from within the interactive scene
            var mgr = {
                re_setScene: function() {
                    _reloadCurrentScene();
                },
                setSceneFromId: function(sceneId) {
                    _setSceneFromId(sceneId);
                },
                setNextButtonEnabled: function(enabled) {
                    _setNextButtonEnabled(enabled);
                },
                setBackButtonEnabled: function(enabled) {
                    _setBackButtonEnabled(enabled);
                },
                highlightNextButton: function() {
                    _highlightNextButton();
                },
                getActivityId: function() {
                    return config.activityId;
                },
                getCurrentSceneId: function() {
                    return currentScene().sceneId;
                },
                getCurrentSceneLocation: function() {
                    return currentScene().path;
                }
            };
            //fire an event on the content window
            var event = document.createEvent('Event');
            event.initEvent('scene_manager_ready', true, true);
            event.data = { manager: mgr };
            iframe.contentWindow.dispatchEvent(event);
        });
    }

    export function initialized() {
        return scenes !== null;
    }

    export function setScene(index) {
        _setScene(index);
    }

    export function setSceneFromId(sceneId) {
        _setSceneFromId(sceneId);
    }

    export function hasNext() {
        return _hasNext() && nextButtonEnabled ? true : false;
    }

    export function hasPrevious() {
        if (scenes === null)
            return false;
        return _sceneIndex > 0 && backButtonEnabled ? true : false;
    }

    export function next() {
        if (!_hasNext())
            return;
        EventEmitter.emit('scene.next', currentScene());
        EventEmitter.emit('scene.willSkip', currentScene());
        _next();
    }

    export function previous() {
        if (!this.hasPrevious())
            return;
        EventEmitter.emit('scene.willSkip', currentScene());
        _setScene(_sceneIndex - 1);
    }

    export function sceneIndex() {
        return _sceneIndex;
    }

    export function reloadCurrentScene() {
        _reloadCurrentScene();
    }

    export function setNextButtonEnabled(enabled) {
        _setNextButtonEnabled(enabled);
    }

    export function setBackButtonEnabled(enabled) {
        _setBackButtonEnabled(enabled);
    }

    function _setNextButtonEnabled(enabled) {
        nextButtonEnabled = enabled;
    }

    function _setBackButtonEnabled(enabled) {
        backButtonEnabled = enabled;
    }

    function _highlightNextButton() {
        EventEmitter.emit('highlight.next', null);
    }

    function _reloadCurrentScene() {
        s('frame').context.contentWindow.location.reload();
    }

    function _setSceneFromId(sceneId) {
        var index = indexOfSceneWithId(sceneId);
        if (index > -1)
            _setScene(index);
    }

    function _hasNext() {
        return scenes === null ? false : _sceneIndex < scenes.length - 1;
    }

    function _next() {
        if (_hasNext()) {
            _setScene(_sceneIndex + 1);
        }
    }

    function currentScene() {
        return scenes[_sceneIndex];
    }

    function _setScene(index) {
        if (scenes === null || scenes.length <= index) {
            return;
        }
        _sceneIndex = index;
        EventEmitter.emit('scene.new', currentScene());
    }

    function registerForEvents() {
        if (EventEmitter === null)
            return;

        //trigger complete actions when video ended
        EventEmitter.on("video.ended", function() {
            executeCompleteAction();
        });

        EventEmitter.on("completeActions", function() {
            _setNextButtonEnabled(true);
            _setBackButtonEnabled(true);
            var actions = currentScene().onCompleteActions;
            var next;
            var back;
            if (actions) {
                actions.forEach(function(s) {
                    if (s.indexOf('next') > -1) {
                        next = s.split(':')[1];
                    }
                    if (s.indexOf('previous') > -1) {
                        back = s.split(':')[1];
                    }
                });
                switch (next) {
                    case 'enable':
                        _setNextButtonEnabled(true);
                        break;
                    case 'disable':
                        _setNextButtonEnabled(false);
                        break;
                }
                switch (back) {
                    case 'enable':
                        _setBackButtonEnabled(true);
                        break;
                    case 'disable':
                        _setBackButtonEnabled(false);
                        break;
                }
                if (actions[0].indexOf('jumpTo') > -1) {
                    _setSceneFromId(actions[0].split(':')[1]);
                }
                if (actions[0].indexOf('exit') > -1) {
                    if (window.parent.player) {
                        //Returns to the launchpad in a SCORM 1.2 setup
                        window.parent.player.Exit();
                    } else {
                        //Returns to the launchpad in a SCORM 2004 setup
                        scormPlayer.navRequest('launchpad');
                    }
                }
            }
        });

        //trigger complete action after 2 seconds, when interactive is done
        EventEmitter.on("interactive.done", function() {
            setTimeout(function() {
                executeCompleteAction();
            }, 2000);
        });

        //
        EventEmitter.on("perform.next", function() {
            next();
        });
    }

    function executeCompleteAction() {

    }

    function indexOfSceneWithId(id) {
        if (scenes === null)
            return -1;
        for (var i = 0; i < scenes.length; i++) {
            if (scenes[i].sceneId == id) {
                return i;
            }
        }
    }

    function dispatchEvent(name, data) {
        var iframe = s('frame').context;
        var event = document.createEvent('Event');
        event.initEvent(name, true, true);
        event.data = data;
        iframe.contentWindow.dispatchEvent(event);
    }
}