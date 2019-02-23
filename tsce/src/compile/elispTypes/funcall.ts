import { Expression, tabs, StringLiteral, LetBinding, LetItem, PropertyAccess, Identifier } from ".";

abstract class FunctionCall extends Expression {
	constructor(readonly args: Expression[]) {
		super()
	}

	emitArgs(indent: number, quoted = false) {
		return this.args.map(x => quoted ? x.emitQuoted(0) : x.emit(0)).reduce((prev, curr) => prev + " " + curr, "")
	}
}

export class FunctionCallDefun extends FunctionCall {
	type: string = 'FunctionCall'

	constructor(readonly leftHand: Identifier, readonly args: Expression[]) {
		super(args);
	}

	emit(indent: number) {
		return `${tabs(indent)}(${this.leftHand.emit(0)} ${this.emitArgs(indent)})`
	}

	emitQuoted(indent: number) {
		return `${tabs(indent)},(${this.leftHand.emit(0)} ${this.emitArgs(indent, true)})`
	}

}

export class FunctionCallVariable extends FunctionCall {
	constructor(readonly leftHand: Expression, readonly args: Expression[]) {
		super(args);
	}

	emit(indent: number) {
		return `${tabs(indent)}(funcall ${this.leftHand.emit(0)} ${this.emitArgs(indent)})`
	}

	emitQuoted(indent: number) {
		return `${tabs(indent)},(funcall ${this.leftHand.emit(0)} ${this.emitArgs(indent, true)})`
	}
}

export interface NamedArgument {
	name: string,
}

export class NamedArgumentsFunctionCallDefun extends FunctionCallDefun {

	bindingName: string
	wrappingLet: LetBinding

	constructor(readonly leftHand: Identifier, arg: Expression, private namedArguments: string[]) {
		super(leftHand, [arg])

		this.bindingName = this.randomBindingName()
		this.wrappingLet = new LetBinding([new LetItem(new Identifier(this.bindingName), arg)])
	}

	randomBindingName() {
		return 'temp' + Math.floor(Math.random() * 100000)
	}

	emitArgs(indent: number, quoted = false) {
		let ret = ''
		for (const arg of this.namedArguments) {
			const propAccess = new PropertyAccess(new Identifier(this.bindingName), new Identifier(arg))
			const propertySelection = quoted ? propAccess.emitQuoted(0) : propAccess.emit(0)
			ret += `\n${tabs(indent)}:${arg} ${propertySelection}`
		}
		return ret
	}

	emit(indent: number) {
		return this.wrappingLet.emitWithBody(indent, (indent) => {
			return `${tabs(indent)}(${this.leftHand.emit(0)} ${this.emitArgs(indent+1)})`
		})
	}

	emitQuoted(indent: number) {
		return this.wrappingLet.emitWithBody(indent, (indent) => {
			return `${tabs(indent)}(${this.leftHand.emit(0)} ${this.emitArgs(indent+1)})`
		}, true)
	}
}

export class NamedArgumentsFunctionCallVariable extends FunctionCallVariable {

	bindingName: string
	wrappingLet: LetBinding

	constructor(readonly leftHand: Expression, arg: Expression, private namedArguments: string[]) {
		super(leftHand, [arg])

		console.log("NamedArgumentsFunctionCallVariable: " + leftHand.type + ": " + leftHand.emit(0))

		this.bindingName = this.randomBindingName()
		this.wrappingLet = new LetBinding([new LetItem(new Identifier(this.bindingName), arg)])
	}

	randomBindingName() {
		return 'temp' + Math.floor(Math.random() * 100000)
	}

	emitArgs(indent: number, quoted = false) {
		let ret = ''
		for (const arg of this.namedArguments) {
			const propAccess = new PropertyAccess(new Identifier(this.bindingName), new Identifier(arg))
			const propertySelection = quoted ? propAccess.emitQuoted(0) : propAccess.emit(0)
			ret += `\n${tabs(indent)}:${arg} ${propertySelection}`
		}
		return ret
	}

	emit(indent: number) {
		return this.wrappingLet.emitWithBody(indent, (indent) => {
			return `${tabs(indent)}(funcall ${this.leftHand.emit(0)} ${this.emitArgs(indent+1)})`
		})
	}

	emitQuoted(indent: number) {
		return this.wrappingLet.emitWithBody(indent, (indent) => {
			return `${tabs(indent)}(funcall ${this.leftHand.emit(0)} ${this.emitArgs(indent+1)})`
		}, true)
	}
}
