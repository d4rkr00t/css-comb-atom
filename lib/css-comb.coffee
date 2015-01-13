CSScomb = require 'csscomb'

path = require 'path'

{CompositeDisposable} = require 'atom'

module.exports = Comb =
  subscriptions: null

  activate: (state) ->
    # Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    @subscriptions = new CompositeDisposable

    @subscriptions.add atom.commands.add 'atom-workspace', 'css-comb:run': => @comb()

  deactivate: ->
    @subscriptions.dispose()

  comb: ->
    filePath = atom.workspace.getActivePaneItem().getPath()
    configPath = path.join(path.dirname(filePath), '.csscomb.json')

    configPath = CSScomb.getCustomConfigPath(configPath)

    if configPath
      @processFile filePath, require(configPath)
    else
      @processFile filePath, CSScomb.getConfig('csscomb')

  processFile: (filePath, config) ->
    comb = new CSScomb(config)
    comb.processFile(filePath)
