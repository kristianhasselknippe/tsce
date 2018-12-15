import { TS, message, tslog, tsarray, getBufferCreate, insertBufferSubstringNoProperties, setBuffer, withCurrentBuffer, insert, doWithCurrentBuffer, pointMax, startProcess, setProcessFilter, Process } from 'emacs'

import { EmacsLib } from './emacsLib'

const dartPath = "c:/tools/dart-sdk/bin/dart.exe"
const snapShotPath = "c:/tools/dart-sdk/bin/snapshots/analysis_server.dart.snapshot"


EmacsLib.require("dash")

function doSomething(msg: string) {
	message("We got some msg: " + msg)
}

function main() {
	let process = startProcess("dart analyzer", "dartanalyzer", dartPath, snapShotPath)

	setProcessFilter(process, (proc: Process, msg: string) => {
		doSomething(msg)
	})

}

main()
