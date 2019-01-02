import { Expression, tabs } from ".";

export class DeleteExpression extends Expression {
	type: string = "DeleteExpression"
	
	constructor(readonly expr: Expression) {
		super()
	}

	emit(indent: number) {
		if (this.expr.isPropertyAccess()) {
			return `${tabs(indent)}(setf ${this.expr.emitLeft()} (map-delete ${this.expr.emitLeftAndRight()}))`
		} else if (this.expr.isElementIndexer()) {
			return `${tabs(indent)}(setf ${this.expr.emitLeft()} (map-delete ${this.expr.emitLeftAndRight()}))`
		} else {
			console.log("Foo ", this.expr)
			throw new Error('Unsupported type for deletion: ' + this.expr.type)
		}
	}
}
