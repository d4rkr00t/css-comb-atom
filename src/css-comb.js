var CSScomb = require('csscomb'),

    path = require('path'),
    fs = require('fs'),

    CompositeDisposable = require('atom').CompositeDisposable,

    allowedGrammas = ['css', 'less', 'scss', 'sass', 'styl'],

    getUserHome = function getUserHome () {
        return process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
    };

export default {
    /**
     * @private
     */
    _subscriptions: undefined,
    _editorObserver: undefined,

    /**
     * Config
     *
     * @type {Object}
     */
    config: {
        shouldNotSearchConfig: {
            title: 'Disable config searching',
            description: 'Disable config searching in project directory and use predefined or custom config',
            type: 'boolean',
            'default': false
        },
        predef: {
            title: 'Predefined configs',
            description: 'Will be used if config is not found in project directory',
            type: 'string',
            'default': 'csscomb',
            'enum': ['csscomb', 'zen', 'yandex']
        },
        customConfig: {
            title: 'Custom config (Full path to file)',
            description: 'Will be used if config is not found in project directory,' +
                         ' has more priority than predefined configs.',
            type: 'string',
            'default': ''
        },
        showNotifications: {
            title: 'Notifications',
            type: 'boolean',
            'default': true
        },
        shouldUpdateOnSave: {
            title: 'On Save',
            description: 'Process file on every save.',
            type: 'boolean',
            'default': false
        },
        processStylus: {
            title: 'Process stylus as sass',
            description: `
                !WARNING! Highly unstable feature, works only when processing selection, and may break on everything.
                Use at your own risk.
            `,
            type: 'boolean',
            'default': false
        }
    },

    activate() {
        this._subscriptions = new CompositeDisposable();

        this._subscriptions.add(atom.commands.add('atom-workspace', {
            'css-comb:run': () => {
                this.comb();
            }
        }));

        this._editorObserver = atom.workspace.observeTextEditors(editor => this.handleEvents(editor));
    },

    deactivate() {
        this._subscriptions.dispose();
        this._editorObserver.dispose();
    },

    /**
     * @private
     */
    handleEvents(editor) {
        editor.getBuffer().onWillSave(() => {
            if (this._isOnSave() && this._isAllowedGrama(editor)) {
                this.comb();
            }
        });
    },

    /**
     * @private
     */
    comb() {
        var filePath = atom.workspace.getActivePaneItem().getPath(),
            config = this._getConfig(filePath),
            selectedText = this._getSelectedText();

        if (selectedText) {
            !this._isOnSave() && this._processSelection(selectedText, config);
        } else {
            this._processFile(filePath, config);
        }
    },

    /**
     * Process whole file be csscomb
     * @private
     *
     * @param {String} filePath — file to process
     * @param {Object} config — csscomb config
     */
    _processFile(filePath, config) {
        var comb = new CSScomb(config);

        try {
            comb.processFile(filePath);

            this._showInfoNotification('File processed by csscomb');
        } catch (err) {
            this._showErrorNotification(err.message);
            console.error(err);
        }
    },

    /**
     * Process only selection by csscomb
     * @private
     *
     * @param {String} string to process
     * @param {Object} config csscomb config
     */
    _processSelection(string, config) {
        var comb = new CSScomb(config);

        try {
            var textEditor = atom.workspace.getActiveTextEditor(),
                syntax = this._getSyntax(textEditor),
                processedString;

            if (syntax !== 'stylus') {
                processedString = comb.processString(string, { syntax });

                textEditor.setTextInBufferRange(textEditor.getSelectedBufferRange(), processedString);

                this._showInfoNotification('Lines processed by csscomb');
            } else {
                this._showErrorNotification('Stylus is not supported yet!');
            }

        } catch (err) {
            this._showErrorNotification(err.message);
            console.error(err);
        }
    },

    /**
     * Gets syntax from text editor
     * @private
     *
     * @param {Object} textEditor
     *
     * @return {String}
     */
    _getSyntax(textEditor) {
        var syntax = textEditor.getGrammar().name.toLowerCase();

        if (atom.config.get('css-comb.processStylus')) {
            syntax = syntax === 'stylus' ? 'sass' : syntax;
        }

        return syntax;
    },

    /**
     * Show info notification
     * @private
     *
     * @param {String} message — notification text
     */
    _showInfoNotification(message) {
        if (this._isShowInfoNotification()) {
            atom.notifications.addInfo(message);
        }
    },

    /**
     * Show error notification
     * @private
     *
     * @param {String} message notification text
     */
    _showErrorNotification(message) {
        if (this._isShowErrorNotification()) {
            atom.notifications.addError(message);
        }
    },

    /**
     * Check if info notifications should be shown
     * @private
     *
     * @return {Boolean}
     */
    _isShowInfoNotification() {
        return atom.config.get('css-comb.showNotifications') && atom.notifications && atom.notifications.addInfo;
    },

    /**
     * Check if error notifications should be shown
     * @private
     *
     * @return {Boolean}
     */
    _isShowErrorNotification() {
        return atom.config.get('css-comb.showNotifications') && atom.notifications && atom.notifications.addError;
    },

    /**
     * Check if on save option enabled
     * @private
     *
     * @return {Boolean}
     */
    _isOnSave() {
        return atom.config.get('css-comb.shouldUpdateOnSave');
    },

    /**
     * Check if file is in allowed gramma list
     * @private
     *
     * @return {Boolean}
     */
    _isAllowedGrama(editor) {
        return allowedGrammas.indexOf(editor.getGrammar().name.toLowerCase()) !== -1;
    },

    /**
     * Search and load csscomb config
     * @private
     *
     * @param {String} filePath from where start searching
     *
     * @return {Object} csscomb config
     */
    _getConfig(filePath) {
        var configPath;

        if (!atom.config.get('css-comb.shouldNotSearchConfig')) {
            configPath = path.join(path.dirname(filePath), '.csscomb.json');
            configPath = CSScomb.getCustomConfigPath(configPath);
        }

        if (configPath) {
            return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        } else {
            configPath = atom.config.get('css-comb.customConfig');

            if (configPath && configPath.match(/^\~/)) {
                configPath = path.join(getUserHome(), configPath.replace(/^\~\//, ''));
            }

            if (configPath && fs.existsSync(configPath)) {
                return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
            } else {
                return CSScomb.getConfig(atom.config.get('css-comb.predef'));
            }
        }
    },

    /**
     * Return selected text for current opened file
     * @private
     *
     * @return {String}
     */
    _getSelectedText() {
        return atom.workspace.getActiveTextEditor().getSelectedText();
    }
};
