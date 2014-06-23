import zerorpc

class sgMessagingClient (object):

	def __init__ (self, commands):
		commandNames = commands.keys()
		commands['COMMAND_LIST'] = self.provideCommandList(commandNames)

		server = zerorpc.Server(commands)
		server.bind('tcp://127.0.0.1:4242')
		server.run()

	def provideCommandList (self, commandNames):
		commands = {}
		commandName = None

		for i in range(len(commandNames)):
			commandName = commandNames[i]
			commands[commandName] = {}

		def responseCommandList (self):
			return commands

		return responseCommandList
