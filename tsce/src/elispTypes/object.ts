import { StringLiteral, NumberLiteral, Identifier, tabs, Expression, Node } from ".";

export type PropertyName = Identifier | NumberLiteral | StringLiteral

export class Property extends Node {

	type: string = 'Property'

	constructor(readonly name: PropertyName,
				readonly value: Expression) {
		super()
	}

	emitName() {
		return this.name.emit(0)
	}

	emitQuoted(indent: number) {
		return `${tabs(indent)}(${this.emitName()} . ${this.value.emitQuoted(0)})`
	}

	emit(indent: number) {
		return `${tabs(indent)}(${this.emitName()} . ${this.value.emit(0)})`
	}
}

export class ObjectLiteral extends Expression {
	type: string = 'ObjectLiteral'

	constructor(readonly properties: Property[]) {
		super()
	}

	isBig() {
		return true
	}

	emitProperties(indent: number) {
		const ret = this.properties.map(prop => prop.emitQuoted(0)).reduce((prev, prop) => {
			return  prev + `\n${tabs(indent)}` + prop
		}, '')
		return ret
	}

	emitQuoted(indent: number) {
		return this.emit(indent, true)
	}

	emit(indent: number, quoted = false) {
		const quotation = quoted ? '' : '`'
		const ret = `${tabs(indent)}${quotation}(
${this.emitProperties(indent+1)}
${tabs(indent)})`
		return ret
	}
}

export class PropertyAccess extends Expression {
	type: string = 'PropertyAccess'

	constructor(readonly leftHand: Expression, readonly rightHand: Identifier) {
		super()
	}

	isPropertyAccess() { return true }

	emitLeftAndRight() {
		return `${this.leftHand.emit(0)} ${this.rightHand.emit(0)}`
	}

	emitQuoted(indent: number) {
		return `${tabs(indent)},(map-elt ${this.leftHand.emit(0)} ${this.rightHand.emitUnquoted(0)})`
	}
	
	emit(indent: number) {
		return `${tabs(indent)}(map-elt ${this.leftHand.emit(0)} ${this.rightHand.emitUnquoted(0)})`
	}
}
