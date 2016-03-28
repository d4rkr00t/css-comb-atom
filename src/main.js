module.exports = {

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
      default: false
    },
    predef: {
      title: 'Predefined configs',
      description: 'Will be used if config is not found in project directory',
      type: 'string',
      default: 'csscomb',
      enum: ['csscomb', 'zen', 'yandex']
    },
    customConfig: {
      title: 'Custom config (Full path to file)',
      description: 'Will be used if config is not found in project directory,'
        + ' has more priority than predefined configs.',
      type: 'string',
      default: ''
    },
    showNotifications: {
      title: 'Notifications',
      type: 'boolean',
      default: true
    },
    shouldUpdateOnSave: {
      title: 'On Save',
      description: 'Process file on every save.',
      type: 'boolean',
      default: false
    },
    processStylus: {
      title: 'Process stylus as sass',
      description: '!WARNING! Highly unstable feature, works only when processing selection, '
        + 'and may break on everything. Use at your own risk.',
      type: 'boolean',
      default: false
    }
  },

  activate(state) {
    const CssComb = require('./css-comb').default;

    this.instance = new CssComb(state);
  },

  deactivate() {
    this.instance && this.instance.deactivate();
  }
};
