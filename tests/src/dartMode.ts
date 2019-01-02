import * as emacs from 'emacs'
import * as s from 's'
import { interactive, withCurrentBuffer } from 'emacs'
import * as json from 'json';

//https://htmlpreview.github.io/?https://github.com/dart-lang/sdk/blob/master/pkg/analysis_server/doc/api.html

let dartPath = "c:/tools/dart-sdk/bin/dart.exe"
let snapshotPath = "c:/tools/dart-sdk/bin/snapshots/analysis_server.dart.snapshot"

const sysType = emacs.symbolName(emacs.systemType)
if (sysType === "darwin") {
	dartPath = "dart"
	snapshotPath = "dartanalyzer"
}

const bufferName = "dartModeBuffer"
function writeToDartModeBuffer(str: string) {
	const buffer = emacs.getBufferCreate(bufferName)
	withCurrentBuffer(buffer, (() => {
		emacs.insert(str)
	})())
}

function writeLineToDartModeBuffer(str: string) {
	writeToDartModeBuffer(str + "\n")
}

const console = {
	log: writeLineToDartModeBuffer
}

interface Server {
	process: emacs.Process
}

let buffer = ''

interface ResponseEvent {
	event: string
}

interface ResponseItem {
	id: string
}

type Response = ResponseEvent | ResponseItem

type ResponseHandler = (response: Response) => void

let responseHandlers: {[index: string]: ResponseHandler } = {}



function decodeResponseString(resp: string) {
	console.log('Decoding response string: ' + resp)
	if (emacs.length(resp) > 0) {
		const item = json.jsonReadFromString(resp) as Response | undefined
		console.log('  We got item: ' + item)
		if (item) {
			if ((<ResponseEvent>item).event) {
				console.log('    It was an event')
			} else {
				const response = item as ResponseItem
				console.log('    It was an item, with id: ' + response.id)
				console.log('      the response handler?: ' + responseHandlers[response.id])
				if (responseHandlers[response.id]) {
					responseHandlers[response.id](item)
				}
			}
		}
	}
}

function dartParseMessage() {
	const split = s.sSplit('\n', buffer)
	for (const s of split) {
		decodeResponseString(s)
	}
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
		command: [dartPath, snapshotPath],
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

type Requests = GetVersionRequest

function dartMakeRequest<TOut>(request: Requests) {
	const jsonString = json.jsonEncode(request) + '\n'
	console.log('Json string ' + jsonString)
	if (server) {
		emacs.processSendString(server.process, jsonString)
	}
}

let idCounter = 0
function dartGetVersion() {
	interactive()
	const id = (idCounter++) + ''
	responseHandlers[id] = (msg: Response) => {
		console.log('Handling response for message id: ' + id)
		console.log('    Message was: ' + json.jsonEncode(msg))
	}
	console.log('Response handlers: ' + responseHandlers)
	dartMakeRequest({
		id,
		method: 'server.getVersion'
	})
}

dartGetVersion()
