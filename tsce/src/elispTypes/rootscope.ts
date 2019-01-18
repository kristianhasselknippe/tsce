import { Scope, Node } from ".";
import { SourceFile } from "ts-simple-ast";
import { Declaration } from "./declaration";

export class RootScope extends Scope {
	type = "RootScope"
	constructor(readonly sourceFile: SourceFile) {
		super()
	}

	getDeclarations(): (Node & Declaration)[] {
		return []
	}
}
