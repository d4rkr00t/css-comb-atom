CSScomb = require 'csscomb'

path = require 'path'
fs = require 'fs'

{CompositeDisposable} = require 'atom'

class Comb

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

  subscriptions: null
  showNotifications: true

  activate: (state) ->
    # Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    @subscriptions = new CompositeDisposable

    @subscriptions.add atom.commands.add 'atom-workspace', 'css-comb:run': => @comb()

  deactivate: ->
    @subscriptions.dispose()

  comb: ->
    @showNotifications = atom.config.get('css-comb.showNotifications') && atom.notifications && atom.notifications.addInfo

    filePath = atom.workspace.getActivePaneItem().getPath()

    if !atom.config.get('css-comb.shouldNotSearchConfig')
      configPath = path.join(path.dirname(filePath), '.csscomb.json')
      configPath = CSScomb.getCustomConfigPath(configPath)

    if configPath
      @processFile filePath, require(configPath)
    else
      configPath = atom.config.get('css-comb.customConfig')

      if configPath && fs.existsSync(configPath)
        @processFile filePath, require(configPath)
      else
        @processFile filePath, CSScomb.getConfig(atom.config.get('css-comb.predef'))

  processFile: (filePath, config) ->
    comb = new CSScomb(config)
    comb.processFile(filePath)

    if @showNotifications
      atom.notifications.addInfo('File processed by csscomb')

module.exports = new Comb
