import * as emacs from "emacs"
import * as s from "s"
import { Response, ResponseEvent } from "./dartModeApi";
import { initializePolyfills } from "./polyfills";

export type ResponseHandler = (response: Response | ResponseEvent) => void

export interface Server {
	process: emacs.Process
}

const bufferName = "dartModeBuffer"
function writeToDartModeBuffer(str: string) {
	const buffer = emacs.getBufferCreate(bufferName)
	emacs.withCurrentBuffer(buffer, (() => {
		emacs.insert(str)
	})())
}

function writeLineToDartModeBuffer(str: string) {
	writeToDartModeBuffer(str + "\n")
}

//TODO: When fixing https://github.com/kristianhasselknippe/tsce/issues/32
const polyfills = initializePolyfills({
	log: writeLineToDartModeBuffer
})
export const console = polyfills.console
export const JSON = polyfills.JSON

let buffer = ''

let responseHandlers: {[index: string]: ResponseHandler } = {}

function decodeResponseString(resp: string) {
	console.log('Decoding response strin: ' + resp)
	if (emacs.length(resp) > 0) {
		const item = JSON.parse(resp) as Response | ResponseEvent | undefined
		console.log('Got item')
		if (item) {
			if ((<ResponseEvent>item).event) {
				console.log('    Response string was event')
			} else {
				console.log('    Response string was item')
				const response = item as Response
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
	//TODO Not sure why s.sSplit says it returns {}
	const theSplit: string[] = s.sSplit('\n', buffer)
	for (const s of theSplit) {
		decodeResponseString(s)
	}
	const splitLength = emacs.length(theSplit)
	if (s.sBlank((theSplit as string[])[splitLength - 1])) {
		buffer = ''
	}
}

function dartFilter(_proc: emacs.Process, msg: string) {
	buffer = buffer + msg
	dartParseMessage()
}

let server: Server | null = null

export function dartStartServer(dartPath: string, snapshotPath: string) {
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
	server = {
		process: emacs.makeProcess(arg)
	}
}

let idCounter = 0
function getNextId() {
	return (idCounter++) + ''
}

export function dartMakeRequest(request: any, handler: ResponseHandler) {
	const id = getNextId()
	let h = handler
	responseHandlers[id] = (msg: Response | ResponseEvent) => {
		handler(msg)
		delete responseHandlers[id]
	}
	request.id = id
	const jsonString = JSON.stringify(request) + '\n'
	if (server) {
		emacs.processSendString(server.process, jsonString)
	}
}
