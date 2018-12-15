import { Expression, tabs } from ".";
import { SymbolType } from "../context";

export class FunctionCall extends Expression {
	type: string = 'FunctionCall'

	constructor(readonly leftHand: Expression, readonly args: Expression[]) {
		super();
	}

	emitArgs() {
		return this.args.map(x => x.emit(0)).reduce((prev, curr) => prev + " " + curr, "")
	}

	funcallIfLambda() {
		if (this.leftHand.isIdentifier()) {
			return this.leftHand.symbol.type == SymbolType.Variable ? "funcall " : ""
		} else {
			return "funcall "
		}
	}

	emit(indent: number) {
		return `${tabs(indent)}(${this.funcallIfLambda()}${this.leftHand.emit(0)} ${this.emitArgs()})`
	}
}
