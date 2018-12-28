import * as emacs from 'emacs'
import { interactive } from 'emacs'
import * as json from 'json'

const dartPath = "c:/tools/dart-sdk/bin/dart.exe"
const snapShotPath = "c:/tools/dart-sdk/bin/snapshots/analysis_server.dart.snapshot"

const console = {
	log: emacs.message
}

interface Server {
	process: emacs.Process
}

let buffer = ''

function parseMessage() {
	console.log('Parsing message from buffer: ' + buffer)
}

function filter(proc: emacs.Process, msg: string) {
	console.log('Filter called with msg: ' + msg)
	buffer = buffer + msg
	parseMessage()
}

function startServer() {
	const server = emacs.makeProcess({
		name: 'Dart analyzer process',
		buffer: 'Dart analyzer buffer',
		command: [dartPath, snapShotPath],
		filter: (proc, msg) => filter(proc, msg),
	})
	return {
		process: server
	}
}

const server = startServer()

interface Request<T extends string> {
	id: string
	method: T
}

type GetVersionRequest = Request<"server.getVersion">

function makeRequest<T extends string, TOut>(request: Request<T>) {
	const jsonString = json.jsonEncode(request)
	emacs.print('Json string ' + jsonString)
	emacs.processSendString(server.process, jsonString)
}

let idCounter = 0
function getVersion() {
	interactive()
	makeRequest({
		id: idCounter + '',
		method: 'server.GetVersion'
	})
}

getVersion()
