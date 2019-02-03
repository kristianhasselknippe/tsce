import { Scope, tabs, LetBinding, Expression, Node } from ".";

export class ForStatement extends Scope {
	constructor(body: Node[] | Node,
				readonly initializer?: LetBinding, //Let binding?
				readonly condition?: Expression,
				readonly incrementor?: Expression) {
		super(body)
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

export class ForOf extends Scope {
	constructor(readonly variable: LetBinding, readonly expression: Expression, body: Node[] | Node) {
		super(body)
	}

	emitLoopVariable() {
		if (this.variable.isIdentifier()) {
			return this.variable.emit(0)
		} else {
			const letBinding = <LetBinding>this.variable
			if (letBinding.bindings.length !== 1) {
				throw new Error("Expecting the variable declaration of for of loops to have one and only one binding")
			}
			// We can assume that we onlye have one binding and that that binding
			// doesn't have an initializer (as this is guaranteed by the TS compiler)
			const binding = letBinding.bindings[0]
			return binding.identifier.emit(0)
		}
	}


	emit(indent: number) {
		return `${tabs(indent)}(cl-loop for ${this.emitLoopVariable()} in ${this.expression.emit(0)} do
${tabs(indent+1)}(progn
${tabs(indent+2)}${this.emitBody(0)}
${tabs(indent+1)})
${tabs(indent)})`
	}
}
