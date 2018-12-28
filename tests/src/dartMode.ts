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

function dartParseMessage() {
	console.log('Parsing message from buffer: ' + buffer)
}

function dartFilter(proc: emacs.Process, msg: string) {
	console.log('Filter called with msg: ' + msg)
	buffer = buffer + msg
	dartParseMessage()
}

function dartStartServer() {
	let arg = {
		name: 'Dart analyzer process',
		buffer: 'Dart analyzer buffer',
		command: [dartPath, snapShotPath],
		filter: (proc: emacs.Process, msg: string) => dartFilter(proc, msg),
	}
	const server = emacs.makeProcess(arg)
	return {
		process: server
	}
}

const server = dartStartServer()

interface Request<T extends string> {
	id: string
	method: T
}

type GetVersionRequest = Request<"server.getVersion">

function dartMakeRequest<T extends string, TOut>(request: Request<T>) {
	const jsonString = json.jsonEncode(request)
	emacs.print('Json string ' + jsonString)
	emacs.processSendString(server.process, jsonString)
}

let idCounter = 0
function dartGetVersion() {
	interactive()
	dartMakeRequest({
		id: idCounter + '',
		method: 'server.GetVersion'
	})
}

dartGetVersion()
