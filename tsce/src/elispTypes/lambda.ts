import { Block, tabs, VariableIdentifier, Identifier } from "./";

export class Lambda extends Block {
	constructor(readonly args: Identifier[]) {
		super(new VariableIdentifier("lambda", []))
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
