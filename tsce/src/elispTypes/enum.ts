import { Expression, Identifier, StringLiteral, Node, tabs, ObjectLiteral, Property, LetBinding, LetItem } from ".";
import { Declaration } from "./declaration";

export class Enum extends LetBinding implements Declaration {
	constructor(readonly propName: Identifier, members: EnumMember[], isInRootScope = false) {
		super([new LetItem(propName, new ObjectLiteral(members))], isInRootScope)
	}

	isDeclaration(): this is Declaration {
		return true
	}

	matchesIdentifier(identifierName: string): boolean {
		return this.propName.identifierName === identifierName
	}
}

export class EnumMember extends Property implements Declaration {
	constructor(readonly name: Identifier | StringLiteral, readonly initializer?: Expression) {
		super(name, initializer ? initializer : name)
	}

	isDeclaration(): this is Declaration {
		return true
	}

	matchesIdentifier(identifierName: string): boolean {
		if (this.name.isIdentifier()) {
			return this.name.identifierName === identifierName
		} else {
			return this.name.str === identifierName
		}
	}

	emitInitializer() {
		if (this.initializer) {
			return this.initializer.emit(0)
		} else {
			return this.name.emit(0)
		}
	}

	emitQuoted(indent: number) {
		return `${tabs(indent)}(${this.name.emit(0)} . ${this.emitInitializer()})`
	}

	emit(indent: number) {
		return `${tabs(indent)}(${this.name.emit(0)} . ${this.emitInitializer()})`
	}
}
