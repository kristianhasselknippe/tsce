import * as emacs from 'emacs'
import { interactive } from 'emacs'
import * as json from 'json'

//https://htmlpreview.github.io/?https://github.com/dart-lang/sdk/blob/master/pkg/analysis_server/doc/api.html

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

let server: Server | null = null

function dartStartServer() {
	let arg: emacs.MakeProcessArgs = {
		name: 'Dart analyzer process',
		buffer: 'Dart analyzer buffer',
		command: [dartPath, snapShotPath],
		filter: (proc: emacs.Process, msg: string) => dartFilter(proc, msg),
		stderr: emacs.getBufferCreate('dart analyzer errors')
	}
	if (server) {
		emacs.deleteProcess(server)
	}
	return {
		process: emacs.makeProcess(arg)
	}
}

server = dartStartServer()

interface Request<T extends string> {
	id: string
	method: T
}

type GetVersionRequest = Request<"server.getVersion">

function dartMakeRequest<T extends string, TOut>(request: Request<T>) {
	const jsonString = json.jsonEncode(request) + '\n'
	emacs.print('Json string ' + jsonString)
	if (server) {
		emacs.processSendString(server.process, jsonString)
	}
}

let idCounter = 0
function dartGetVersion() {
	interactive()
	dartMakeRequest({
		id: (idCounter++) + '',
		method: 'server.GetVersion'
	})
}

dartGetVersion()
