CSScomb = require 'csscomb'

path = require 'path'
fs = require 'fs'

allowedGrammas = ['css', 'less', 'scss', 'sass', 'styl']

{CompositeDisposable} = require 'atom'

module.exports =
  #
  # CONFIG
  #

  config:
    shouldNotSearchConfig:
      title: 'Disable config searching'
      description: 'Disable config searching in project directory and use predefined or custom config'
      type: 'boolean'
      default: false
    predef:
      title: 'Predefined configs'
      description: 'Will be used if config is not found in project directory'
      type: 'string'
      default: 'csscomb'
      enum: ['csscomb', 'zen', 'yandex']
    customConfig:
      title: 'Custom config (Full path to file)'
      description: 'Will be used if config is not found in project directory, has more priority than predefined configs.'
      type: 'string'
      default: ''
    showNotifications:
      title: 'Notifications'
      type: 'boolean'
      default: true
    shouldUpdateOnSave:
      title: 'On Save'
      description: 'Process file on every save.'
      type: 'boolean'
      default: false

  #
  # PROPS
  #

  subscriptions: null

  #
  # PUBLIC
  #

  activate: (state) ->
    # Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    @subscriptions = new CompositeDisposable

    @subscriptions.add atom.commands.add 'atom-workspace', 'css-comb:run': => @comb()

    @editorObserver = atom.workspace.observeTextEditors (editor) =>
      @handleEvents(editor)

  deactivate: ->
    @subscriptions.dispose()
    @editorObserver.dispose()

  handleEvents: (editor) ->
    editor.getBuffer().onWillSave =>
      if @_isOnSave() && @_isAllowedGrama(editor)
        @comb();

  comb: ->
    filePath = atom.workspace.getActivePaneItem().getPath()
    config = @_getConfig(filePath)

    selectedText = @_getSelectedText()

    if selectedText
      @_processSelection(selectedText, config)
    else
      @_processFile(filePath, config)

  #
  # PRIVATE
  #

  ###*
  # Process whole file by csscomb
  # @param {String} filePath file to process
  # @param {Object} config csscomb config
  ###
  _processFile: (filePath, config) ->
    comb = new CSScomb(config)
    comb.processFile(filePath)

    @_showInfoNotification('File processed by csscomb')

  ###*
  # Process only selection by csscomb
  # @param {String} string to process
  # @param {Object} config csscomb config
  ###
  _processSelection: (string, config) ->
    comb = new CSScomb(config)

    try
        processedString = comb.processString(string)
        textEditor = atom.workspace.getActiveTextEditor()
        textEditor.setTextInBufferRange(textEditor.getSelectedBufferRange(), processedString)

        @_showNotifications('Lines processed by csscomb')
    catch error
        @_showErrorNotification(error.message)
        console.error error

  ###*
  # Show info notification
  # @param {String} message notification text
  ###
  _showInfoNotification: (message) ->
    if @_isShowInfoNotification()
      atom.notifications.addInfo(message)

  ###*
  # Show error notification
  # @param {String} message notification text
  ###
  _showErrorNotification: (message) ->
    if @_isShowErrorNotification()
      atom.notifications.addError(message)

  ###*
  # Check if info notifications should be shown
  # @return {Boolean}
  ###
  _isShowInfoNotification: ->
    atom.config.get('css-comb.showNotifications') && atom.notifications && atom.notifications.addInfo

  ###*
  # Check if error notifications should be shown
  # @return {Boolean}
  ###
  _isShowErrorNotification: ->
    atom.config.get('css-comb.showNotifications') && atom.notifications && atom.notifications.addError

  ###*
  # Check if on save option enabled
  # @return {Boolean}
  ###
  _isOnSave: ->
    atom.config.get('css-comb.shouldUpdateOnSave')

  ###*
  # Check if file is in allowed gramma list
  # @return {Boolean}
  ###
  _isAllowedGrama: (editor) ->
    editor.getGrammar().name.toLowerCase() in allowedGrammas

  ###*
  # Search and load csscomb config
  # @param {String} filePath from where start searching
  # @return {Object} csscomb config
  ###
  _getConfig: (filePath) ->
    if !atom.config.get('css-comb.shouldNotSearchConfig')
      configPath = path.join(path.dirname(filePath), '.csscomb.json')
      configPath = CSScomb.getCustomConfigPath(configPath)

    if configPath
      return require(configPath)
    else
      configPath = atom.config.get('css-comb.customConfig')

      if configPath && fs.existsSync(configPath)
        return require(configPath)
      else
        return CSScomb.getConfig(atom.config.get('css-comb.predef'))

  ###*
  # Get selected text of current text editor tab
  # @return {String}
  ###
  _getSelectedText: ->
    atom.workspace.getActiveTextEditor().getSelectedText()
