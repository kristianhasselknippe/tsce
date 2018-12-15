import { StringLiteral, NumberLiteral, Identifier, tabs, Expression, Node } from ".";

export type PropertyName = Identifier | NumberLiteral | StringLiteral

export class Property extends Node {
	type: string = 'Property'

	constructor(readonly name: PropertyName,
				readonly value: Expression) {
		super()
	}

	emitName() {
		if (this.name.type !== 'Identifier') {
			return this.name.emit(0)
		} else {
			return (this.name as Identifier).emitQuoted(0)
		}
	}

	emit(indent: number) {
		return `${tabs(indent)}(${this.emitName()} ${this.value.emit(0)})`
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
		const ret = this.properties.map(prop => prop.emit(0)).reduce((prev, prop) => {
			return  prev + `\n${tabs(indent)}` + prop
		})
		return ret
	}

	emit(indent: number) {
		const ret = `${tabs(indent)}(ht
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

	emit(indent: number) {
		return `${tabs(indent)}(ht-get ${this.leftHand.emit(0)} ${this.rightHand.emitQuoted(0)})`
	}
}
