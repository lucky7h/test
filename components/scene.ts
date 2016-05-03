/// <reference path="../Utils/Load_json.ts" />
/// <reference path="../common/SceneManager.ts" />
/// <reference path="../common/Player.ts" />
/// <reference path="../Utils/Services.ts" />
/// <reference path="Video.ts" />

module Scene {
    var config = Load.config;
    var glossary = Load.glossary;
    var sceneMgr = SceneManager;
    var scormPlayer = Player.scormPlayer;

    class SceneObj {
        public playable;
        public path;
        public videoName;
        public videoPath;
        public framePath;
        public sceneId;
        public title;
        public CC;
        public title_index;
        public completeAction;
        public onLoad;
        public onCompleteActions;
        public setBookmark;
        public allowFullscreen;

        constructor(data) {
            if (typeof data === 'undefined') {
                throw new Error("Scene Data must be defined");
            }
            if (data === null) {
                throw new Error("Scene Data cannot be null");
            }
            this.playable = data.type === 'video';
            this.path = data.location;
            this.videoName = this.playable ? data.videoName : '';
            this.videoPath = this.playable && this.videoName.length > 0 ? 'content/' + data.location + '/videos/' + this.videoName : '';
            this.framePath = this.playable ? '' : 'content/' + data.location + '/index.html';
            this.sceneId = data.id;
            this.title = data.title;
            this.CC = data.CC;
            this.title_index = data.title_index;
            this.completeAction = data.onComplete;
            this.onLoad = data.onLoad;
            this.onCompleteActions = data.onCompleteActions;
            this.setBookmark = data.setBookmark;
            this.allowFullscreen = (typeof data.allowFullscreen === 'undefined') ? false : data.allowFullscreen;
        }
    }

    class SceneControls {
        public id;
        public title;
        public moduleTitle;
        public hasMenu;
        public videoPath;
        public videoPlayed;
        public framePath;
        public allowFullscreen;
        public isMobile;
        public isFullscreen;
        public isCcVisible;
        public scene;
        public loading;
        public lastScenePlayable;
        public onFullScreen;
        public onExit;
        public onPlay;
        public onGlossary;
        public onReset;

        constructor() {
            var _instance = this;
            this.id = 'scene';
            this.title = '';
            this.moduleTitle = config.moduleTitle;
            this.hasMenu = false;
            this.videoPath = '';
            this.videoPlayed = false;
            this.framePath = '';
            this.allowFullscreen = false;
            this.isMobile = null;
            this.isFullscreen = false;
            this.isCcVisible = false;
            this.scene = null;
            this.loading = false;
            this.lastScenePlayable = null;
            this.onFullScreen = function() {
                if (_instance.isFullscreen) {
                    VideoCtrl.minimize();
                } else {
                    VideoCtrl.maximize();
                }
                _instance.isFullscreen = !_instance.isFullscreen;
            };
            this.onReset = function(e) {
                sceneMgr.setScene(0);
            };
            this.onExit = function(e) {
                if (window.parent.player) {
                    //Returns to the launchpad in a SCORM 1.2 setup
                    window.parent.player.Exit();
                } else {
                    //Returns to the launchpad in a SCORM 2004 setup
                    scormPlayer.navRequest('launchpad');
                }
            };
            this.onGlossary = function(e) {
                var glossary = s("#glossary");
                if (glossary.is(':hidden')) {
                    if (VideoCtrl.playing()) {
                        VideoCtrl.pause();
                    }
                    glossary.show();
                } else {
                    glossary.hide();
                }
            };

            // populateCatalog(config.scenes);
            // populateGlossary(glossary.letters);

            EventEmitter.on('load', function load() {
                EventEmitter.on("video.changed", function(evt) {
                    //reset progress bar
                    TweenMax.killAll();
                    s('#angle-progress-bar-desktop').setToPercentage(0, 0.001);
                    s('#angle-progress-bar-desktop').attr('result', '0');
                    s('#angle-progress-bar-mobile').setToPercentage(0, 0.001);
                    s('#angle-progress-bar-mobile').attr('result', '0');
                    //initialize video again and reset progress bar
                    s('video source').context.src = evt.data + '.mp4';
                    s('video').context.load();
                });
                this.removeEventListener('load', load);
            });
            EventEmitter.on("scene.new", function(evt) {
                var scene = evt.data;
                _instance.lastScenePlayable = scene && scene.playable;
                _instance.scene = scene;
                _instance.allowFullscreen = scene.allowFullscreen;
                _instance.title = scene.title;
                _instance.loading = true;
                //only change the video path in the html once - for the first video
                if (_instance.videoPath === '' && scene.videoPath !== '') _instance.videoPath = scene.videoPath;
                _instance.framePath = scene.framePath;
                newScene(scene);
            });
            //change title and properties of scene only after the new scene has been loaded
            EventEmitter.on("interactive.loaded", function() {
                _instance.title = _instance.scene.title;
                _instance.allowFullscreen = _instance.scene.allowFullscreen;
                _instance.loading = false;
                _instance.lastScenePlayable = false;
                s('#angle-title text').context.textContent = _instance.title;
                s('#angle-title-mobile text').context.textContent = _instance.title;
                s('video source').context.removeAttribute('src');
                s('video track').context.removeAttribute('src');
                var track = document.querySelector('video track');
                if (track) {
                    track.parentNode.removeChild(track);
                }
            });
            //change title and properties of video only after the new scene has been loaded
            EventEmitter.on("video.loaded", function() {
                s('#frame').context.removeAttribute('src');
                _instance.title = _instance.scene.title;
                _instance.loading = false;
                _instance.lastScenePlayable = true;
                s('#angle-title text').context.textContent = _instance.title;
                s('#angle-title-mobile text').context.textContent = _instance.title;
            });
            //Whenever a new scene is loaded, if it is an interactive scene, then initialize it
            EventEmitter.on("scene.loaded", function(evt) {
                var scene = evt.data;
                if (!scene.playable) {
                    TweenMax.killAll();
                    s('#frame').show().context.src = 'content/' + scene.path + '/index.html';
                    //display iframe when it is loaded
                    s('#frame').listen('load', function load() {
                        EventEmitter.emit("interactive.loaded", scene);
                        this.removeEventListener('load', load);
                    });
                }
            });
            // Capture Play Next, Back button from scene manager.
            EventEmitter.on("scene.next", function(scene) {
                scormPlayer.Commit();
            });
            EventEmitter.on("scene.previous", function(scene) {
                scormPlayer.Commit();
            });
            //Notify when interactive scene is manually done
            EventEmitter.on("interactive.done", function() {
                if (this.scene.sceneId !== null)
                    interactiveSceneFinished(this.scene.sceneId);
            });
            //Notify on video progressing
            EventEmitter.on("video.timeupdate", function(currentTimePercent) {
                // if (scenePlayable && sceneId !== null) {
                //     lastTimeUpdate = currentTimePercent;
                //     setSceneLocation(sceneId, currentTimePercent);
                // }
            });
            //bookmark when bookmarkable video is about to be skipped
            EventEmitter.on("scene.willSkip", function(scene) {
                // if (sceneId !== null && setBookmark) {
                //     bookmark(sceneId, lastTimeUpdate);
                // }
            });
            //Notify complete action of scene (video or interactive scene)
            EventEmitter.on("module.autoComplete", function() {
                //Automatically set completion of a module through the wrapper API when the module is accessed through an Scorm 1.2 Launchpad
                setModuleCompletion('completed');
            });

            function newScene(_scene) {
                // Change completion status as incomplete.
                var scene = config.scene(_scene.sceneId);
                var sceneIndex = config.getSceneIndex(_scene.sceneId) + 1;
                var sceneCompletionStatus = scormPlayer.GetObjectiveValue(sceneIndex, 'objective_completion_status');
                // Remember current scene as bookmark.
                if (scene.setBookmark === true) {
                    scormPlayer.SetValue('bookmark', _scene.sceneId);
                }

                switch (scene.type) {
                    case 'video':
                        switch (sceneCompletionStatus) {
                            case 'not attempted':
                            case 'unknown':
                                scormPlayer.SetObjectiveValue(sceneIndex, 'objective_completion_status', 'incomplete');
                                break;
                            default:
                                // For other status always re-send viewed scene completion status
                                // Server side may used this field to calculate 'Experienced' TinCAN API from 'completed' to 'completed'.
                                scormPlayer.SetObjectiveValue(sceneIndex, 'objective_completion_status', sceneCompletionStatus);
                                break;
                        }
                        //onload behaviours check
                        var onLoad = config.scenes[sceneIndex - 1].onLoad;
                        var next;
                        var previous;
                        if (typeof onLoad !== 'undefined' && onLoad) {
                            onLoad.forEach(function(button) {
                                if (button.indexOf('next') > -1) {
                                    next = button;
                                }
                                if (button.indexOf('previous') > -1) {
                                    previous = button;
                                }
                            });
                        }
                        checkNextButton(next, true);
                        checkBackButton(previous, true);
                        break;
                    case 'interactive':
                        if (!scene.manualCompletion) {
                            switch (sceneCompletionStatus) {
                                case 'not attempted':
                                case 'unknown':
                                    scormPlayer.SetObjectiveValue(sceneIndex, 'objective_completion_status', 'incomplete');
                                    scormPlayer.SetObjectiveValue(sceneIndex, 'objective_completion_status', 'completed');
                                    break;
                            }
                        }
                        else {
                            switch (sceneCompletionStatus) {
                                case 'not attempted':
                                case 'unknown':
                                    scormPlayer.SetObjectiveValue(sceneIndex, 'objective_completion_status', 'incomplete');
                                    break;
                            }
                        }
                        break;
                }
                EventEmitter.emit('scene.loaded', _scene);
            }

            function populateCatalog(scenes) {
                for (var i = 0; i < scenes.length; i++) {
                    if (scenes[i].hasOwnProperty('title_index')) {
                        var item = s('li');
                        item.text(scenes[i].title_index);
                        item.data('id', scenes[i].id);
                        itemOnClick(item);
                        s('#catalog').appendChild(item);
                    }
                }
                function itemOnClick(item) {
                    item.click(function() {
                        sceneMgr.setSceneFromId(item.data('id'));
                    });
                }
            }

            function populateGlossary(letters) {
                var glossary_terms = s('#glossary .terms');
                var term_title = s('#glossary .description .term_title');
                var term_description = s('#glossary .description .term_description');

                for (var i = 0; i < letters.length; i++) {
                    var index_letter = s('<h1></h1>');
                    index_letter.addClass('index_letter');
                    index_letter.text(letters[i].letter);
                    glossary_terms.appendChild(index_letter);
                    glossary_terms.appendChild(s('<hr>'));
                    glossary_terms.appendChild(s('<ul></ul>').addClass(letters[i].letter));

                    for (var j = 0; j < letters[i].terms.length; j++) {
                        var item = s('<li></li>');
                        item.addClass('term_title');
                        var title = s('<div></div>');
                        title.text(letters[i].terms[j].term);
                        item.appendChild(title);
                        itemOnClick(item, letters[i].terms[j].term, letters[i].terms[j].description);
                        s('#glossary ul.' + letters[i].letter).appendChild(item);
                    }
                }
                function itemOnClick(item, title, description) {
                    item.click(function() {
                        term_title.text(title);
                        term_description.text(description);
                    });
                }

                s("#search_criteria").listen("keyup", function() {
                    var g = s(this).val().toLowerCase();
                    s(".terms .term_title div").each(function() {
                        var s = s(this).text().toLowerCase();
                        s(this).closest('.term_title')[s.indexOf(g) !== -1 ? 'show' : 'hide']();
                    });
                    if (g.length !== 0) {
                        glossary_terms.find('h1').hide();
                        glossary_terms.find('hr').hide();
                    } else {
                        glossary_terms.find('h1').show();
                        glossary_terms.find('hr').show();
                    }
                });
            }

            function interactiveSceneFinished(sceneId) {
                var scene = config.scene(sceneId);
                var sceneIndex = config.getSceneIndex(sceneId) + 1;
                var sceneCompletionStatus = scormPlayer.GetObjectiveValue(sceneIndex, 'objective_completion_status');
                if (scene.manualCompletion) {
                    switch (sceneCompletionStatus) {
                        case 'incomplete':
                            scormPlayer.SetObjectiveValue(sceneIndex, 'objective_completion_status', 'completed');
                            break;
                    }
                }
            }

            function setModuleCompletion(value) {
                var currentModuleCompletion = scormPlayer.GetValue('completion_status');
                if (currentModuleCompletion !== value) {
                    scormPlayer.SetValue('completion_status', value);
                    scormPlayer.Commit();
                }
            }

            function setSceneLocation(sceneId, location) {
                //console.log("setSceneLocation for " + sceneId + " to " + location);
                if (!isNaN(location)) {
                    var currentThreshold = (location / 100);
                    var configuredThreshold = config.config.completionThreshold || 0;
                    var sceneIndex = config.getSceneIndex(sceneId) + 1;
                    var sceneCompletionStatus = scormPlayer.GetObjectiveValue(sceneIndex, 'objective_completion_status');
                    //onload behaviours check
                    var onLoad = config.scenes[sceneIndex - 1].onLoad;
                    var next;
                    var previous;
                    if (onLoad) {
                        onLoad.forEach(function(button) {
                            if (button.indexOf('next') > -1) {
                                next = button;
                            }
                            if (button.indexOf('previous') > -1) {
                                previous = button;
                            }
                        });
                    }
                    if (configuredThreshold <= currentThreshold) {
                        switch (sceneCompletionStatus) {
                            case 'incomplete':
                                scormPlayer.SetObjectiveValue(sceneIndex, 'objective_completion_status', 'completed');
                                break;
                        }
                        checkNextButton(next, true);
                        checkBackButton(previous, true);
                    } else {
                        if (sceneCompletionStatus !== 'completed') {
                            checkNextButton(next, false);
                            checkBackButton(previous, true);
                        }
                        else {
                            checkNextButton(next, true);
                            checkBackButton(previous, true);
                        }
                    }
                }
            }

            function checkNextButton(next, boo) {
                if (!next) {
                    SceneManager.setNextButtonEnabled(boo);
                } else {
                    var value = next.split(':')[1];
                    switch (value) {
                        case 'disable':
                            SceneManager.setNextButtonEnabled(false);
                            break;
                        case 'enable':
                            SceneManager.setNextButtonEnabled(true);
                            break;
                    }
                }
            }
            function checkBackButton(previous, boo) {
                if (!previous) {
                    SceneManager.setBackButtonEnabled(boo);
                } else {
                    var value = previous.split(':')[1];
                    switch (value) {
                        case 'disable':
                            SceneManager.setBackButtonEnabled(false);
                            break;
                        case 'enable':
                            SceneManager.setBackButtonEnabled(true);
                            break;
                    }
                }
            }

            function bookmark(sceneId, location) {

            }
        }
    }

    export function create(data) {
        return new SceneObj(data);
    }
    export var controls = new SceneControls();
}