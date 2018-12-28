import { Block, tabs, Identifier } from "./";
import { SymbolType } from "../context";

export class Lambda extends Block {
	constructor(readonly args: string[]) {
		super(new Identifier("lambda", {
			name: "lambda",
			type: SymbolType.Lambda
		}, []))
	}

	emitArgs() {
		return this.args.reduce((prev, curr) => prev + " " + curr, "")
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
