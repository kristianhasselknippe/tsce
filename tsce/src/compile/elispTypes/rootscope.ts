import { Scope, Node } from ".";
import { SourceFile } from "ts-simple-ast";

export class RootScope extends Scope {
	type = "RootScope"
	constructor(body: Node[] | Node) {
		super(body)
	}
}
