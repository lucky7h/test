declare var weaver_loadGlossary, weaverConfig;
module Load {
    export var config = loadConfig();
    export var glossary = loadGlossary();

    function loadConfig() {
        var temp = loadFile();
        var config = {
            config: loadFile(),
            moduleTitle: temp.title || "",
            initialIndex: 0,
            initialTitle: temp.scenes[0].title,
            scenes: temp.scenes,
            api: temp.api,
            activityId: temp.activityId,
            scene: scene,
            getSceneIndex: getSceneIndex
        };

        return config;

        function scene(index) {
            var matchScene = null;
            if (isNaN(index)) {
                // Find by id.
                for (var i = 0; i < config.scenes.length; i++) {
                    var scene = config.scenes[i];
                    if (scene.id == index) {
                        matchScene = scene;
                        break;
                    }
                }
            }
            else {
                // Find by index.
                matchScene = config.scenes[index];
            }

            return matchScene;
        }

        function getSceneIndex(sceneId) {
            for (var i = 0; i < config.scenes.length; i++) {
                var scene = config.scenes[i];
                if (scene.id == sceneId) {
                    return i;
                }
            }
            return -1;
        }

        function loadFile() {
            if (typeof weaverConfig ==='undefined') {
                var request = new XMLHttpRequest();
                request.open("GET", "./config.json", false);
                if (request.overrideMimeType)
                    request.overrideMimeType("application/json");
                request.send(null);
                config = JSON.parse(request.responseText);
                return config;
            } else {
                return weaverConfig;
            }
        }
    }

    function loadGlossary() {
        var glossary = loadFile();
        return glossary.letters;

        function loadFile() {
            if (weaver_loadGlossary) {
                var request = new XMLHttpRequest();
                request.open("GET", "./glossary.json", false);
                if (request.overrideMimeType)
                    request.overrideMimeType("application/json");
                request.send();
                return JSON.parse(request.responseText);
            } else {
                return {
                    letters: []
                }
            }
        }
    }
}