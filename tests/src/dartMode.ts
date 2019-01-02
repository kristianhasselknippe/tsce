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
	console.log('Decoding response strin: ' + resp)
	if (emacs.length(resp) > 0) {
		const item = json.jsonReadFromString(resp) as Response | undefined
		console.log('Got item')
		if (item) {
			if ((<ResponseEvent>item).event) {
				console.log('    Response string was event')
			} else {
				console.log('    Response string was item')
				const response = item as ResponseItem
				console.log('    Response string was item: ' + response.id)
				const handler = responseHandlers[response.id]
				console.log('      Handler for it: ' + handler)
				if (handler) {
					handler(item)
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
	const splitLength = emacs.length(split)
	if (s.sBlank(split[splitLength - 1])) {
		buffer = ''
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

let idCounter = 0
function getNextId() {
	return (idCounter++) + ''
}

function dartMakeRequest<TOut>(request: any, handler: ResponseHandler) {
	console.log("Creating request with handler" + handler)
	const id = getNextId()
	let h = handler
	responseHandlers[id] = (msg: Response) => {
		handler(msg)
		delete responseHandlers[id]
	}
	console.log('Response handlers; ' + responseHandlers)
	request.id = id
	const jsonString = json.jsonEncode(request) + '\n'
	console.log('Json string ' + jsonString)
	if (server) {
		emacs.processSendString(server.process, jsonString)
	}
}

interface RequestError {
	code: string
	message: string
	stackTrace?: string
}

interface GetVersionResponse extends ResponseItem {
	error?: RequestError
	result: {
		version: String
	}
}

//[Interactive]
function dartGetVersion() {
	dartMakeRequest({
		method: 'server.getVersion'
	}, (msg: Response) => {
		console.log("Handling response in handler")
		const gvr = msg as GetVersionResponse
		console.log('Got version back: ' + gvr.result.version)
	})
}

dartGetVersion()

interface Location {
	file: string
	offset: number
	length: number
	startLine: number
	startColumn: number
}

type GetErrorsRequest = Request<'analysis.GetErros'>

interface AnalysisError {
	severity: string
	type: string
	location: Location
	message: string
	correction?: string
	code: string
	hasFix?: boolean
}

interface GetErrorsResponse extends ResponseItem {
	error?: RequestError
	result: {
		errors: AnalysisError[]
	}
}

function dartGetErrors(filePath: string) {
	dartMakeRequest({
		method: 'server.getVersion',
		params: {
			file: filePath
		}
	}, (msg: Response) => {
		const ger = <GetErrorsResponse>msg
		console.log('Errors for file: ' + filePath)
		for (const error of ger.result.errors) {
			console.log('Error: ' + error)
		}
	})
}

//[Interactive]
function dartGetErrorsForCurrentFile() {
	const currentFile = emacs.bufferFileName()
	console.log('Current file: ' + currentFile)
}

//request: {
//  "id": String
//  "method": "analysis.getErrors"
//  "params": {
//	"file": FilePath
//  }
//}
//
//response: {
//  "id": String
//  "error": optional RequestError
//  "result": {
//	"errors": List<AnalysisError>
//  }
//}
