/* global atom */
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _csscomb = require('csscomb');

var _csscomb2 = _interopRequireDefault(_csscomb);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _atom = require('atom');

var allowedGrammas = ['css', 'less', 'scss', 'sass', 'styl'];

function getUserHome() {
  return process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
}

var CssComb = (function () {
  function CssComb() {
    var _this = this;

    _classCallCheck(this, CssComb);

    this._subscriptions = new _atom.CompositeDisposable();

    this._subscriptions.add(atom.commands.add('atom-workspace', {
      'css-comb:run': function cssCombRun() {
        return _this.comb();
      }
    }));

    this._editorObserver = atom.workspace.observeTextEditors(function (editor) {
      return _this.handleEvents(editor);
    });
  }

  CssComb.prototype.deactivate = function deactivate() {
    this._subscriptions.dispose();
    this._editorObserver.dispose();
  };

  /**
   * @private
   *
   * @param {TextEditor} editor
   */

  CssComb.prototype.handleEvents = function handleEvents(editor) {
    var _this2 = this;

    editor.getBuffer().onWillSave(function () {
      if (_this2._isOnSave() && _this2._isAllowedGrama(editor)) {
        _this2.comb();
      }
    });
  };

  /**
   * @private
   */

  CssComb.prototype.comb = function comb() {
    var filePath = atom.workspace.getActivePaneItem().getPath();
    var config = this._getConfig(filePath);
    var selectedText = this._getSelectedText();

    if (selectedText) {
      !this._isOnSave() && this._processSelection(selectedText, config);
    } else {
      var text = this._getText();

      this._processFile(text, config);
    }
  };

  /**
   * Process whole file be csscomb
   * @private
   *
   * @param {String} text — content of file to process
   * @param {Object} config — csscomb config
   */

  CssComb.prototype._processFile = function _processFile(text, config) {
    var comb = new _csscomb2['default'](config);
    var textEditor = atom.workspace.getActiveTextEditor();
    var syntax = this._getSyntax(textEditor);

    try {
      var processedString = comb.processString(text, { syntax: syntax });
      textEditor.setText(processedString);

      this._showInfoNotification('File processed by csscomb');
    } catch (err) {
      this._showErrorNotification(err.message);
      console.error(err);
    }
  };

  /**
   * Process only selection by csscomb
   * @private
   *
   * @param {String} string to process
   * @param {Object} config csscomb config
   */

  CssComb.prototype._processSelection = function _processSelection(string, config) {
    var comb = new _csscomb2['default'](config);

    try {
      var textEditor = atom.workspace.getActiveTextEditor();
      var syntax = this._getSyntax(textEditor);

      if (syntax !== 'stylus') {
        var processedString = comb.processString(string, { syntax: syntax });

        textEditor.setTextInBufferRange(textEditor.getSelectedBufferRange(), processedString);

        this._showInfoNotification('Lines processed by csscomb');
      } else {
        this._showErrorNotification('Stylus is not supported yet!');
      }
    } catch (err) {
      this._showErrorNotification(err.message);
      console.error(err);
    }
  };

  /**
   * Gets syntax from text editor
   * @private
   *
   * @param {Object} textEditor
   *
   * @returns {String}
   */

  CssComb.prototype._getSyntax = function _getSyntax(textEditor) {
    var syntax = textEditor.getGrammar().name.toLowerCase();

    if (atom.config.get('css-comb.processStylus')) {
      return syntax === 'stylus' ? 'sass' : syntax;
    }

    return syntax;
  };

  /**
   * Show info notification
   * @private
   *
   * @param {String} message — notification text
   */

  CssComb.prototype._showInfoNotification = function _showInfoNotification(message) {
    if (this._isShowInfoNotification()) {
      atom.notifications.addInfo(message);
    }
  };

  /**
   * Show error notification
   * @private
   *
   * @param {String} message notification text
   */

  CssComb.prototype._showErrorNotification = function _showErrorNotification(message) {
    if (this._isShowErrorNotification()) {
      atom.notifications.addError(message);
    }
  };

  /**
   * Check if info notifications should be shown
   * @private
   *
   * @returns {Boolean}
   */

  CssComb.prototype._isShowInfoNotification = function _isShowInfoNotification() {
    return atom.config.get('css-comb.showNotifications') && atom.notifications && atom.notifications.addInfo;
  };

  /**
   * Check if error notifications should be shown
   * @private
   *
   * @returns {Boolean}
   */

  CssComb.prototype._isShowErrorNotification = function _isShowErrorNotification() {
    return atom.config.get('css-comb.showNotifications') && atom.notifications && atom.notifications.addError;
  };

  /**
   * Check if on save option enabled
   * @private
   *
   * @returns {Boolean}
   */

  CssComb.prototype._isOnSave = function _isOnSave() {
    return atom.config.get('css-comb.shouldUpdateOnSave');
  };

  /**
   * Check if file is in allowed gramma list
   * @private
   *
   * @param {TextEditor} editor
   *
   * @returns {Boolean}
   */

  CssComb.prototype._isAllowedGrama = function _isAllowedGrama(editor) {
    return allowedGrammas.indexOf(editor.getGrammar().name.toLowerCase()) !== -1;
  };

  /**
   * Search and load csscomb config
   * @private
   *
   * @param {String} filePath from where start searching
   *
   * @returns {Object} csscomb config
   */

  CssComb.prototype._getConfig = function _getConfig(filePath) {
    var configPath = undefined;

    if (!atom.config.get('css-comb.shouldNotSearchConfig')) {
      configPath = _path2['default'].join(_path2['default'].dirname(filePath), '.csscomb.json');
      configPath = _csscomb2['default'].getCustomConfigPath(configPath);
    }

    if (configPath) {
      return JSON.parse(_fs2['default'].readFileSync(configPath, 'utf-8'));
    } else {
      configPath = atom.config.get('css-comb.customConfig');

      if (configPath && configPath.match(/^\~/)) {
        configPath = _path2['default'].join(getUserHome(), configPath.replace(/^\~\//, ''));
      }

      if (configPath && _fs2['default'].existsSync(configPath)) {
        return JSON.parse(_fs2['default'].readFileSync(configPath, 'utf-8'));
      } else {
        return _csscomb2['default'].getConfig(atom.config.get('css-comb.predef'));
      }
    }
  };

  /**
   * Return selected text for current opened file
   * @private
   *
   * @returns {String}
   */

  CssComb.prototype._getSelectedText = function _getSelectedText() {
    return atom.workspace.getActiveTextEditor().getSelectedText();
  };

  /**
   * Return whole text for current active editor
   * @private
   *
   * @returns {String}
   */

  CssComb.prototype._getText = function _getText() {
    return atom.workspace.getActiveTextEditor().getText();
  };

  return CssComb;
})();

exports['default'] = CssComb;
module.exports = exports['default'];