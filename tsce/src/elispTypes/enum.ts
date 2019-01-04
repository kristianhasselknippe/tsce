import { Expression, Identifier, StringLiteral, tabs, ObjectLiteral, Property, LetBinding, LetItem } from ".";

export class Enum extends LetBinding {
	constructor(propName: Identifier, members: EnumMember[], isInRootScope = false) {
		super([new LetItem(propName, new ObjectLiteral(members))], isInRootScope)
	}
}

export class EnumMember extends Property {
	constructor(readonly name: Identifier | StringLiteral, readonly initializer?: Expression) {
		super(name, initializer ? initializer : name)
	}

	emitInitializer() {
		if (this.initializer) {
			return this.initializer.emit(0)
		} else {
			return this.name.emit(0)
		}
	}

	emit(indent: number) {
		return `${tabs(indent)}(${this.name.emit(0)} . ${this.emitInitializer()})`
	}
}
