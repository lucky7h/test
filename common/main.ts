/// <reference path="../components/Video.ts" />
/// <reference path="../components/Scene.ts" />
/// <reference path="../components/Menus.ts" />
/// <reference path="../Utils/Services.ts" />
/// <reference path="../Utils/Load_json.ts" />
/// <reference path="SceneManager.ts" />
/// <reference path="Player.ts" />

declare var splash, s;
(function(window) {
    var scormPlayer = Player.scormPlayer;
    var config = Load.config;

    //Initialize manager
    SceneManager.initialize(config.scenes);
    //Initialize Scene
    sceneInit();
    //Initialize Screen
    EventEmitter.on('load', function(evt) {
        //turn off the splash library resize function
        splash.offResize();
        document.body.removeAttribute('style');
        s('svg').context.removeAttribute('width');
        s('svg').context.removeAttribute('height');
    });

    function sceneInit() {
        var bookmarkedName = scormPlayer.GetValue('bookmark');
        var bookmaredScene = config.scene(bookmarkedName);
        var bookmarkedIndex = config.getSceneIndex(bookmarkedName);

        // Initialize()
        if (window.parent.player) {
            //Passing the wrapper API when the module is accessed through an SCORM 1.2 Launchpad
            scormPlayer.Initialize(window.parent.player);
        } else {
            //check api type
            if (config.api) {
                switch (config.api) {
                    case 'none':
                        var testAPI = scormPlayer.getTestAPI();
                        scormPlayer.Initialize(testAPI);
                        break;
                    case 'TinCan':
                        //scormPlayer.Initialize(new tincan(config));
                        break;
                }
            } else {
                scormPlayer.Initialize();
            }
        }
        scormPlayer.Register();
        scormPlayer.InitializeObjective(config);

        // Goto the location from previous viewed.
        if (bookmaredScene) {
            config.initialLocation = bookmaredScene.location;
            config.initialTitle = bookmaredScene.title;
            config.initialIndex = bookmarkedIndex;
        }
        getInitialIndex(config);

        function getInitialIndex(config) {
            var sceneId = window.location.href.split('?')[1];
            if (sceneId) {
                config.initialIndex = config.getSceneIndex(sceneId);
            }
        }
    }
} (window));