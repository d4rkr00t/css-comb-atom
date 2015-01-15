CSScomb = require 'csscomb'

path = require 'path'
fs = require 'fs'

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

  deactivate: ->
    @subscriptions.dispose()

  comb: ->
    filePath = atom.workspace.getActivePaneItem().getPath()
    config = @_getConfig(filePath)

    @_processFile(filePath, config)

  #
  # PRIVATE
  #

  _processFile: (filePath, config) ->
    comb = new CSScomb(config)
    comb.processFile(filePath)

    if @_showNotifications()
      atom.notifications.addInfo('File processed by csscomb')

  _showNotifications: ->
    atom.config.get('css-comb.showNotifications') && atom.notifications && atom.notifications.addInfo

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
