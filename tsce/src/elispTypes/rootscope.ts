import { Scope } from ".";
import { SourceFile } from "ts-simple-ast";

export class RootScope extends Scope {
	type = "RootScope"
	constructor(sourceFile: SourceFile) {
		super()
	}

	emit() {
		return this.emitBody(0, false)
	}
}
