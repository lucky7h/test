module Player {
    class Player {
        public Version;
        public API;
        public Cache;
        public ResolvedKeyMap;
        public KeyMap;
        public updateCache;
        public Register;
        public FindAPI;
        public GetAPI;
        public Initialize;
        public GetValue;
        public SetValue;
        public GetObjectiveValue;
        public SetObjectiveValue;
        public Commit;
        public Terminate;
        public InitializeObjective;
        public GetNotes;
        public SetNotes;
        public openResourceFile;
        public navRequest;
        public getTestAPI;
        public GeneratePDF;
        public UpdateCache;

        constructor() {
            this.Version = null;
            this.API = null;
            this.Cache = {};
            this.ResolvedKeyMap = true;
            this.KeyMap = {
                SCORM12: {
                    learner_name: "cmi.core.student_name",
                    completion_threshold: null,
                    completion_status: "cmi.core.lesson_status",
                    success_status: "cmi.core.lesson_status",
                    progress: null,

                    session_time: "cmi.core.session_time",
                    total_time: "cmi.core.total_time",
                    max_time_allowed: "cmi.student_data.max_time_allowed",

                    suspend_data: "cmi.suspend_data",
                    bookmark: "cmi.core.lesson_location",

                    score_list: "cmi.core.score_children",
                    score_raw: "cmi.core.score.raw",
                    score_scaled: null,
                    score_min: "cmi.core.score.min",
                    score_max: "cmi.core.score.max",
                    passing_score: "cmi.student_data.mastery_score",

                    mode: "cmi.core.lesson_mode",

                    objectives_count: "cmi.objectives._count",

                    objectives_prefix: "cmi.objectives.",
                    objective_id: ".id",
                    objective_completion_status: ".status",
                    objective_success_status: ".status"
                },
                SCORM2004: {
                    learner_name: "cmi.learner_name",
                    completion_threshold: "cmi.completion_threshold",
                    completion_status: "cmi.completion_status",
                    success_status: "cmi.success_status",
                    progress: "cmi.progress_measure",

                    session_time: "cmi.session_time",
                    total_time: "cmi.total_time",
                    max_time_allowed: "cmi.max_time_allowed",

                    suspend_data: "cmi.suspend_data",
                    bookmark: "cmi.location",

                    score_list: "cmi.score._children",
                    score_raw: "cmi.score.raw",
                    score_scaled: "cmi.score.scaled",
                    score_min: "cmi.score.min",
                    score_max: "cmi.score.max",
                    passing_score: "cmi.scaled_passing_score",

                    mode: "cmi.mode",

                    objectives_count: "cmi.objectives._count",

                    objectives_prefix: "cmi.objectives.",
                    objective_id: ".id",
                    objective_completion_status: ".completion_status",
                    objective_success_status: ".success_status"
                }
            };
            this.UpdateCache = function(key, value) {
                if (value !== null || value !== undefined) {
                    this.Cache[key] = value;
                }
            };
            this.Register = function() {
                var self = this;
                window.onunload = function() {
                    self.Commit();
                    self.Terminate();
                };
            };
            this.FindAPI = function(context) {
                if (context.API) {
                    this.API = context.API;
                    this.Version = "SCORM12";
                }
                if (context.API_1484_11) {
                    this.API = context.API_1484_11;
                    this.Version = "SCORM2004";
                }
                if (context.frames && !this.API) {
                    for (var i = 0; i < context.frames.length && !this.API; i++) {
                        this.FindAPI(context.frames[i]);
                    }
                }
                return (this.API !== null);
            };
            this.GetAPI = function(context) {
                if (!this.API) {
                    if (!context) context = window.top;
                    while (this.API === null && context !== null && !context.closed) {
                        if (!this.FindAPI(context)) {
                            if (context.opener) {
                                context = context.opener.top;
                            } else {
                                this.Version = "SCORM2004";
                                this.API = new TestAPI();
                            }
                        }
                    }
                }
                return this.API;
            };
            this.Initialize = function(cmi, delegate, event) {
                var ret = null;
                if (cmi) {
                    this.API = cmi;
                    this.ResolvedKeyMap = false;
                    if (cmi.Version) this.Version = cmi.Version;
                }
                if (this.GetAPI()) {
                    switch (this.Version) {
                        case "SCORM12":
                            ret = this.GetAPI().LMSInitialize("");
                            break;
                        case "SCORM2004":
                            ret = this.GetAPI().Initialize("");
                            break;
                        case "TINCAN":
                            ret = this.GetAPI().Initialize("");
                            break;
                    }
                }
                // Reset SCORM cache.
                this.Cache = {};

                return ret;
            };
            this.GetValue = function(key, resolvedKeyMap) {
                var ret = null;
                var useCache = false;
                if (this.GetAPI()) {

                    if (!resolvedKeyMap && this.ResolvedKeyMap) {
                        key = (this.KeyMap[this.Version] !== null ? this.KeyMap[this.Version][key] : null);
                    }

                    if (key !== null) {
                        // Loading from cache before calling to LMS.
                        if (this.Cache[key]) {
                            ret = this.Cache[key];
                            useCache = true;
                        }
                        else {
                            // Load form LMS.
                            switch (this.Version) {
                                case "SCORM12":
                                    ret = this.GetAPI().LMSGetValue(key);
                                    break;
                                case "SCORM2004":
                                    ret = this.GetAPI().GetValue(key)
                                    break;
                                case "TINCAN":
                                    ret = this.GetAPI().GetValue(key)
                                    break;
                            }
                            this.UpdateCache(key, ret);
                        }
                    }
                }

                return ret;
            }
            this.SetValue = function(key, value, resolvedKeyMap) {
                var ret = false;
                if (this.GetAPI()) {
                    var originalKey = key;
                    if (!resolvedKeyMap && this.ResolvedKeyMap) {
                        key = (this.KeyMap[this.Version] !== null ? this.KeyMap[this.Version][key] : null);
                    }

                    // Track SCORM value to LMS API.
                    if (key !== null) {
                        switch (this.Version) {
                            case "SCORM12":
                                ret = this.GetAPI().LMSSetValue(key, value);
                                break;
                            case "SCORM2004":
                                ret = this.GetAPI().SetValue(key, value);
                                break;
                            case "TINCAN":
                                ret = this.GetAPI().SetValue(key, value);
                                break;
                        }

                        // Update original cache.
                        this.UpdateCache(key, value);
                    }

                    // Detect for progress change then update module completion status if in SCORM 1.2
                    if (this.Version === 'SCORM12' && originalKey === 'progress') {
                        var newModuleCompletion;
                        if (value >= 0.95) {
                            newModuleCompletion = 'completed';
                        } else {
                            newModuleCompletion = 'incomplete';
                        }
                        var currentModuleCompletion = this.GetValue('completion_status');
                        if (currentModuleCompletion !== newModuleCompletion) {
                            this.SetValue('completion_status', newModuleCompletion);
                            this.Commit();
                        }
                    }
                }
                return ret;
            };
            this.GetObjectiveValue = function(index, suffix) {
                var ret = null;
                var key;
                if (this.GetAPI && this.Version !== 'TINCAN') {
                    suffix = (this.KeyMap[this.Version] ? this.KeyMap[this.Version][suffix] : null);
                    key = (suffix !== null) ? this.KeyMap[this.Version]["objectives_prefix"] + index + suffix : null;
                    if (key !== null) {
                        ret = this.GetValue(key, true);
                    }
                }
                else {
                    ret = this.GetAPI().GetObjectiveValue(index, suffix, this);
                }
                return ret;
            }
            this.SetObjectiveValue = function(index, suffix, value) {
                var originalSuffix = suffix;
                var ret = false;
                if (this.GetAPI() && this.Version !== 'TINCAN') {
                    suffix = (this.KeyMap[this.Version] !== null ? this.KeyMap[this.Version][suffix] : null);
                    var key = (suffix !== null) ? this.KeyMap[this.Version]["objectives_prefix"] + index + suffix : null;

                    if (key !== null) {

                        // Set value for objective.
                        ret = this.SetValue(key, value, true);

                        // Auto calculate progress measure when objective_completion_status == completed.
                        if ((originalSuffix === 'objective_completion_status') && (value === 'completed')) {
                            // Finding total completed scenes.
                            var totalScenes = (this.GetValue('objectives_count') - 1) || 0;

                            var completedScenes = 0; // We must set count complete before save state so we always add one.
                            for (var i = 1; i <= totalScenes; i++) {
                                var sc = this.GetObjectiveValue(i, 'objective_completion_status');
                                switch (sc) {
                                    case 'completed':
                                        // Include only changed state from previous only (not same index).
                                        completedScenes++;
                                        break;
                                }
                            }

                            var currentProgress = Math.round((completedScenes / totalScenes) * 100) / 100;
                            var savedObjectiveProgress = parseFloat(this.GetValue('progress')) || 0;

                            // Update progress measure when progress change only.
                            if (currentProgress !== savedObjectiveProgress) {
                                this.SetValue('progress', currentProgress);
                            }
                        }
                    }
                }
                else {
                    ret = this.GetAPI().SetObjectiveValue(index, suffix, value, this);
                }
                return ret;
            };
            this.Commit = function(delegate, event) {
                var ret = false;
                if (this.GetAPI()) {
                    switch (this.Version) {
                        case "SCORM12":
                            ret = this.GetAPI().LMSCommit("");
                            break;
                        case "SCORM2004":
                            ret = this.GetAPI().Commit("");
                            break;
                        case "TINCAN":
                            ret = this.GetAPI().Commit("");
                            break;
                    }
                }
                return ret;
            };
            this.Terminate = function(delegate, event) {
                var ret = false;
                if (this.GetAPI()) {
                    switch (this.Version) {
                        case "SCORM12":
                            ret = this.GetAPI().LMSFinish("");
                            break;
                        case "SCORM2004":
                            ret = this.GetAPI().Terminate("");
                            break;
                        case "TINCAN":
                            ret = this.GetAPI().Terminate("");
                            break;
                    }
                }
                return ret;
            };
            this.InitializeObjective = function(config) {
                if (this.Version !== 'TINCAN') {
                    // Restore cmi.objectives._count
                    var objectives_count = this.GetValue('objectives_count');
                    if (isNaN(objectives_count)) {
                        objectives_count = 0;
                    }

                    // Set up data from the system
                    for (var i = 1; i < objectives_count; i++) {
                        var scene = config.scenes[i - 1];
                        var objective_completion_status = this.GetObjectiveValue(i, 'objective_completion_status');

                        if (isNullOrEmpty(objective_completion_status)) {
                            this.SetObjectiveValue(i, 'objective_completion_status', 'not attempted');
                        }
                    }

                    // Correct progress if not exists.
                    var module_progress = parseFloat(this.GetValue('progress'));

                    if (isNaN(module_progress)) {
                        // Update zero progress.
                        this.SetValue('progress', 0);
                    } else {
                        // Verify module completion status.
                        var currentModuleCompletionStatus = this.GetValue('completion_status');
                        if (isNullOrEmpty(currentModuleCompletionStatus)) {
                            // Update progress which trigger compleikon status.
                            this.SetValue('progress', module_progress);
                        }
                    }
                }
                // Initialize objectives.
                function isNullOrEmpty(input) {
                    return input === '' || input === null || input === undefined;
                }
            };
            this.GetNotes = function(activityId) {
                var notes = "null";
                if (this.GetAPI()) {
                    if (this.GetAPI().findActivityNotes) {
                        notes = this.GetAPI().findActivityNotes(activityId);
                    }
                }
                return notes;
            };
            this.SetNotes = function(data) {
                var ret = null;
                if (this.GetAPI()) {
                    if (this.GetAPI().updateActivityNotes) {
                        ret = this.GetAPI().updateActivityNotes(data);
                    }
                }
                return ret;
            };
            this.GeneratePDF = function(data) {
                var ret = null;
                if (this.GetAPI()) {
                    if (this.GetAPI().generatePdf) {
                        if (data) {
                            ret = this.GetAPI().generatePdf(data.pdfTemplateId, data.activityId);
                        } else {
                            ret = this.GetAPI().generatePdf();
                        }
                    }
                }
                return ret;
            };
            this.openResourceFile = function(activityId, resourceName) {
                var ret = null;
                if (this.GetAPI()) {
                    if (this.GetAPI().openResourceFile) {
                        ret = this.GetAPI().openResourceFile(activityId, resourceName);
                    }
                }
                return ret;
            };
            this.navRequest = function(identifier) {
                if (this.GetAPI()) {
                    this.Commit();
                    if (this.GetAPI().GetValue('adl.nav.request_valid.choice.{target=' + identifier + '}') === 'true') {
                        this.GetAPI().SetValue('adl.nav.request', '{target=' + identifier + '}choice');
                        return this.Terminate();
                    }
                }
            };
            this.getTestAPI = function() {
                var testAPI = new TestAPI();
                testAPI.Version = "SCORM2004";
                return testAPI;
            };
        }

    }

    function TestAPI() {
        this.Commit = function() {
            console.log('TestAPI::Commit()');
        };

        this.Initialize = function() {
            console.log('TestAPI::Initialize()');
        };

        this.GetValue = function(key) {
            console.log('TestAPI::GetValue(' + key + ')');
        };

        this.SetValue = function(key, value) {
            console.log('TestAPI::SetValue(' + key + ', ' + value + ')');
        };

        this.Terminate = function() {
            console.log('TestAPI::Terminate()');
        };
        this.findActivityNotes = function(activityId) {
            console.log('TestAPI::findActivityNotes(' + activityId + ')');
        };
        this.updateActivityNotes = function(data) {
            console.log('TestAPI::updateActivityNotes(' + JSON.stringify(data) + ')');
        };
        this.generatePdf = function(pdfTemplateId, activityId) {
            console.log('TestAPI::generatePdf(' + pdfTemplateId + ', ' + activityId + ')');
        };
        this.openResourceFile = function(activityId, resourceName) {
            console.log('TestAPI::openResourceFile(' + activityId + ', ' + resourceName + ')');
        };
    }

    export var scormPlayer = new Player();
}
