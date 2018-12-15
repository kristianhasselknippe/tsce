import { TS, message, tslog, tsarray, getBufferCreate, insertBufferSubstringNoProperties, setBuffer, withCurrentBuffer, insert, doWithCurrentBuffer, pointMax, startProcess, setProcessFilter, Process } from 'emacs'

function main() {
	let dartPath = "c:/tools/dart-sdk/bin/dart.exe"
	let snapShotPath = "c:/tools/dart-sdk/bin/snapshots/analysis_server.dart.snapshot"
	let process = startProcess("dart analyzer", "dartanalyzer", dartPath, snapShotPath)

	setProcessFilter(process, (proc: Process, msg: string) => {
		message("We got some msg: " + msg)
	})

}
