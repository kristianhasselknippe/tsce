import { Block, tabs, VariableIdentifier, Identifier, Node, FunctionArg } from "./";
import { Declaration } from "./declaration";

export class Lambda extends Block {
	type: string = "Block"

	constructor(readonly args: FunctionArg[], body: Node[] | Node) {
		super(new VariableIdentifier("lambda", []), body)
	}

	getDeclarations(): (Node & Declaration)[] {
		return this.args
	}

	emitArgs() {
		return this.args.reduce((prev, curr) => prev + " " + curr.emit(0), "")
	}

	emitIt(indent: number) {
		return `(lambda (${this.emitArgs()})
${this.emitBlock(indent + 2, this.emitBody(indent+3))}
${tabs(indent)})`
	}

	emitQuoted(indent: number) {
		return `${tabs(indent)},${this.emitIt(indent)}`
	}

	emit(indent: number) {
		return `${tabs(indent)}${this.emitIt(indent)}`
	}
}
