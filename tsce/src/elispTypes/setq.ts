import { LetItem, tabs, Expression, Identifier } from ".";

export class Setq extends LetItem {
	constructor(identifier: Identifier, initializer?: Expression) {
		super(identifier, initializer)
	}

	emit(indent: number) {
		return `${tabs(indent)}(setq ${this.hyphenateName()} ${this.emitInitializer(0)})`
	}
}
