import { Expression, tabs } from ".";
import { SymbolType } from "../context";

export class FunctionCall extends Expression {
	type: string = 'FunctionCall'

	constructor(readonly leftHand: Expression, readonly args: Expression[]) {
		super();
	}

	emitArgsAsNamedArguments() {
		if (this.args.length !== 1) {
			throw new Error('Functions declared with the NamedArguments directive can only receive one arugment, ' + this.args.length + ' was supplied')
		}
		const arg = this.args[0]

		let ret = '{\n'
		for (const arg of this.args) {
			
		}
		ret += '}'
		return ret
	}

	emitArgs() {
		if (this.leftHand.isIdentifier() && this.leftHand.useNamedArguments) {
			return this.emitArgsAsNamedArguments()
		}else {
			return this.args.map(x => x.emit(0)).reduce((prev, curr) => prev + " " + curr, "")
		}
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
