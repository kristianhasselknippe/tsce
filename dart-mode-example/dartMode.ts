import * as emacs from 'emacs'
import { Request, Response, GetVersionResponse, GetErrorsResponse, ResponseEvent } from './dartModeApi'
import { dartMakeRequest, dartStartServer, console } from './dartModeServer';

//https://htmlpreview.github.io/?https://github.com/dart-lang/sdk/blob/master/pkg/analysis_server/doc/api.html

let dartPath = "c:/tools/dart-sdk/bin/dart.exe"
let snapshotPath = "c:/tools/dart-sdk/bin/snapshots/analysis_server.dart.snapshot"

const sysType = emacs.symbolName(emacs.systemType)
if (sysType === "darwin") {
	dartPath = "dart"
	snapshotPath = "dartanalyzer"
}

dartStartServer(dartPath, snapshotPath)

//[Interactive]
function dartGetVersion() {
	dartMakeRequest({
		method: 'server.getVersion'
	}, (msg: Response | ResponseEvent) => {
		console.log("Handling response in handler")
		const gvr = msg as GetVersionResponse
		console.log('Got version back: ' + gvr.result.version)
	})
}

dartGetVersion()


function dartGetErrors(filePath: string) {
	dartMakeRequest({
		method: 'server.getVersion',
		params: {
			file: filePath
		}
	}, (msg: Response | ResponseEvent) => {
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
