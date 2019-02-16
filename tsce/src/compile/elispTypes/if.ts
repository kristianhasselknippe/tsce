import { Expression, tabs, Body } from ".";

export class IfExpression extends Expression {
	type = 'IfExpression';

	constructor(private predicate: Expression,
				private thenBlock: Body,
				private elseBlock?: Body) {
		super()
	}

	private get hasThen() {
		return typeof this.elseBlock !== 'undefined'
	}

	emitThen(indent: number) {
		if (this.thenBlock.body.length === 0) {
			return `${tabs(indent+1)}'nil`
		}
		return `${this.thenBlock.emit(indent+1)}`
	}

	emitElse(indent: number) {
		if (this.elseBlock)
			return `${this.elseBlock.emit(indent+0.5)}`
		else {
			return ""
		}
	}

	emit(indent: number) {
		const flowType = this.hasThen ? "if" : "when"
		return `${tabs(indent)}(${flowType} ${this.predicate!.emit(0)}
${this.emitThen(indent)}
${this.emitElse(indent)}
${tabs(indent)})`
	}
}
