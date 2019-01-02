import { Expression, Identifier, StringLiteral } from ".";

export class Enum extends Expression {
	constructor(readonly propName: Identifier, readonly members: EnumMember[]) {
		super()
	}
}

export class EnumMember extends Expression {
	constructor(name: Identifier | StringLiteral, readonly initializer?: Expression) {
		super()
	}

	emit(indent: number) {
		continue here
	}
}
