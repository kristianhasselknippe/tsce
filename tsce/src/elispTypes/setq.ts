import { LetItem, tabs, Expression, Identifier } from ".";

export class Set extends LetItem {
	constructor(identifier: Identifier, initializer?: Expression) {
		super(identifier, initializer)
	}

	emit(indent: number) {
		return `${tabs(indent)}(setf ${this.hyphenateName()} ${this.emitInitializer(0)})`
	}
}
