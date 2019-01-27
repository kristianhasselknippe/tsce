import { Expression, Identifier, tabs, ElementIndexer } from ".";

export class Assignment extends Expression {
	constructor(readonly assignee: Expression,
				readonly value: Expression) {
		super()
	}

	emit(indent: number) {
		return `${tabs(indent)}(setf ${this.assignee.emit(0)} ${this.value.emit(0)})`
	}
}
