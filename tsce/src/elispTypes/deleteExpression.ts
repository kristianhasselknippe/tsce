import { Expression, tabs } from ".";

export class DeleteExpression extends Expression {
	constructor(readonly expr: Expression) {
		super()
	}

	emit(indent: number) {
		if (this.expr.isPropertyAccess()) {
			return `${tabs(indent)}(map-delete ${this.expr.emitLeftAndRight()})`
		} else {
			return `${tabs(indent)}(map-delete ${this.expr.emit(0)})`
		}
	}
}
