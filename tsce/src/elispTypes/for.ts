import { Scope, tabs, LetBinding, Expression } from ".";

export class ForStatement extends Scope {
	constructor(readonly initializer?: LetBinding, //Let binding?
				readonly condition?: Expression,
				readonly incrementor?: Expression) {
		super([])
	}

	emit(indent: number) {
		let body = ""
		if (this.condition) {
			const bodyEmittor = (indent: number) => {
				let emittedIncrementor = ""
				if (this.incrementor) {
					emittedIncrementor = this.incrementor.emit(indent+1)
				}
				return `${tabs(indent)}(while ${this.condition!.emit(0)}
${this.emitBody(indent+1)}
${emittedIncrementor}
${tabs(indent)})`
			}

			if (this.initializer) {
				return this.initializer.emitWithBody(indent, bodyEmittor)
			} else {
				return bodyEmittor(indent)
			}
		}

		return body
	}
}
