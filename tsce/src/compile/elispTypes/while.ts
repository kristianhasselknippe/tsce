import { Scope, Expression, tabs } from ".";

export class While extends Scope {
	type: string = "While"

	constructor(readonly condition: Expression) {
		super()
	}

	emit(indent: number) {
		return `${tabs(indent)}(while ${this.condition.emit(0)}
${this.emitBody(indent + 1)}
${tabs(indent)})`
	}
}
