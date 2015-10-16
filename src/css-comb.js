/* global atom */
import CSScomb from 'csscomb';

import path from 'path';
import fs from 'fs';
import { CompositeDisposable } from 'atom';

const allowedGrammas = ['css', 'less', 'scss', 'sass', 'styl'];

function getUserHome() {
  return process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
}

export default class CssComb {
  constructor() {
    this._subscriptions = new CompositeDisposable();

    this._subscriptions.add(atom.commands.add('atom-workspace', {
      'css-comb:run': () => this.comb()
    }));

    this._editorObserver = atom.workspace.observeTextEditors(editor => this.handleEvents(editor));
  }

  deactivate() {
    this._subscriptions.dispose();
    this._editorObserver.dispose();
  }

  /**
   * @private
   *
   * @param {TextEditor} editor
   */
  handleEvents(editor) {
    editor.getBuffer().onWillSave(() => {
      if (this._isOnSave() && this._isAllowedGrama(editor)) {
        this.comb();
      }
    });
  }

  /**
   * @private
   */
  comb() {
    const filePath = atom.workspace.getActivePaneItem().getPath();
    const config = this._getConfig(filePath);
    const selectedText = this._getSelectedText();

    if (selectedText) {
      !this._isOnSave() && this._processSelection(selectedText, config);
    } else {
      const text = this._getText();

      this._processFile(text, config);
    }
  }

  /**
   * Process whole file be csscomb
   * @private
   *
   * @param {String} text — content of file to process
   * @param {Object} config — csscomb config
   */
  _processFile(text, config) {
    const comb = new CSScomb(config);
    const textEditor = atom.workspace.getActiveTextEditor();
    const syntax = this._getSyntax(textEditor);

    try {
      const processedString = comb.processString(text, { syntax });
      textEditor.setText(processedString);

      this._showInfoNotification('File processed by csscomb');
    } catch (err) {
      this._showErrorNotification(err.message);
      console.error(err);
    }
  }

  /**
   * Process only selection by csscomb
   * @private
   *
   * @param {String} string to process
   * @param {Object} config csscomb config
   */
  _processSelection(string, config) {
    const comb = new CSScomb(config);

    try {
      const textEditor = atom.workspace.getActiveTextEditor();
      const syntax = this._getSyntax(textEditor);

      if (syntax !== 'stylus') {
        const processedString = comb.processString(string, { syntax });

        textEditor.setTextInBufferRange(textEditor.getSelectedBufferRange(), processedString);

        this._showInfoNotification('Lines processed by csscomb');
      } else {
        this._showErrorNotification('Stylus is not supported yet!');
      }
    } catch (err) {
      this._showErrorNotification(err.message);
      console.error(err);
    }
  }

  /**
   * Gets syntax from text editor
   * @private
   *
   * @param {Object} textEditor
   *
   * @returns {String}
   */
  _getSyntax(textEditor) {
    const syntax = textEditor.getGrammar().name.toLowerCase();

    if (atom.config.get('css-comb.processStylus')) {
      return syntax === 'stylus' ? 'sass' : syntax;
    }

    return syntax;
  }

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
  }

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
  }

  /**
   * Check if info notifications should be shown
   * @private
   *
   * @returns {Boolean}
   */
  _isShowInfoNotification() {
    return atom.config.get('css-comb.showNotifications') && atom.notifications && atom.notifications.addInfo;
  }

  /**
   * Check if error notifications should be shown
   * @private
   *
   * @returns {Boolean}
   */
  _isShowErrorNotification() {
    return atom.config.get('css-comb.showNotifications') && atom.notifications && atom.notifications.addError;
  }

  /**
   * Check if on save option enabled
   * @private
   *
   * @returns {Boolean}
   */
  _isOnSave() {
    return atom.config.get('css-comb.shouldUpdateOnSave');
  }

  /**
   * Check if file is in allowed gramma list
   * @private
   *
   * @param {TextEditor} editor
   *
   * @returns {Boolean}
   */
  _isAllowedGrama(editor) {
    return allowedGrammas.indexOf(editor.getGrammar().name.toLowerCase()) !== -1;
  }

  /**
   * Search and load csscomb config
   * @private
   *
   * @param {String} filePath from where start searching
   *
   * @returns {Object} csscomb config
   */
  _getConfig(filePath) {
    let configPath;

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
  }

  /**
   * Return selected text for current opened file
   * @private
   *
   * @returns {String}
   */
  _getSelectedText() {
    return atom.workspace.getActiveTextEditor().getSelectedText();
  }

  /**
   * Return whole text for current active editor
   * @private
   *
   * @returns {String}
   */
  _getText() {
    return atom.workspace.getActiveTextEditor().getText();
  }
}
