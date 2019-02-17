import { Block, tabs, Identifier, Node, FunctionArg } from "./";

export class Lambda extends Block {
	type: string = "Block"

	constructor(readonly args: FunctionArg[]) {
		super(new Identifier("lambda"))
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
