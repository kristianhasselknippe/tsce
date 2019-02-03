import { Scope, Node } from ".";
import { SourceFile } from "ts-simple-ast";
import { Declaration, DeclarationsSource } from "./declaration";

export class RootScope extends Scope {
	type = "RootScope"
	constructor(body: Node[] | Node) {
		super(body)
	}

	getDeclarations(): (Node & Declaration)[] {
		let ret: (Node & Declaration)[] = []
		if (this.body instanceof Array) {
			for (const node of this.body) {
				if (node.isDeclarationsSource()) {
					ret = ret.concat(node.getDeclarations())
				} else if (node.isDeclaration()) {
					ret.push(node)
				}
			}
		} else {
			if (this.body.isDeclaration()) {
				ret.push(this.body)
			}
		}
		return ret
	}
}
