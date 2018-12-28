import { Expression, tabs, ObjectLiteral, LetBinding, LetItem, PropertyAccess, Identifier } from ".";
import { SymbolType } from "../context";
import { CompilerDirective } from "./compilerDirective";

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

export interface NamedArgument {
	name: string,
}

export class NamedArgumentsFunctionCall extends FunctionCall {

	BindingName: string
	WrappingLet: LetBinding

	constructor(leftHand: Expression, arg: Expression, private namedArgumentsNames: string[]) {
		super(leftHand, [arg])

		this.BindingName = this.randomBindingName()
		this.WrappingLet = new LetBinding([new LetItem(new Identifier(this.BindingName), arg)])
	}

	randomBindingName() {
		return 'temp' + Math.floor(Math.random() * 100000)
	}

	emitArgs() {
		let ret = ''
		for (const argName of this.namedArgumentsNames) {
			const propertySelection = (new PropertyAccess(new Identifier(this.BindingName), new Identifier(argName))).emit(0)
			ret += `:${argName} ${propertySelection} `
		}
		return ret
	}

	emit(indent: number) {
		return this.WrappingLet.emitWithBody(indent, (indent) => {
			return `${tabs(indent)}(${this.funcallIfLambda()}${this.leftHand.emit(0)} ${this.emitArgs()})`
		})
	}
}
