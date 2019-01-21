import { Scope, Node } from ".";
import { SourceFile } from "ts-simple-ast";
import { Declaration, DeclarationsSource } from "./declaration";

export class RootScope extends Scope {
	type = "RootScope"
	constructor(readonly sourceFile: SourceFile) {
		super()
	}

	getDeclarations(): (Node & Declaration)[] {
		let ret: (Node & Declaration)[] = []
		for (const node of this.body) {
			if (node.isDeclarationsSource()) {
				ret = ret.concat(node.getDeclarations())
			} else if (node.isDeclaration()) {
				ret.push(node)
			}
		}
		return ret
	}
}
