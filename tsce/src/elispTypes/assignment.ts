import { Expression, Identifier, tabs } from ".";

export class Assignment extends Expression {
	constructor(readonly assignee: Identifier,
				readonly value: Expression) {
		super()
	}

	emit(indent: number) {
		return `${tabs(indent)}(setq ${this.assignee.emit(0)} ${this.value.emit(0)})`
	}
}
