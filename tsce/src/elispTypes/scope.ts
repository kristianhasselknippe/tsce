import { Expression, Node } from ".";

export class Scope extends Expression {
	type: string = 'Scope'

	constructor(readonly body: Node[]) {
		super()
	}

	isBig() {
		return true
	}

	emitBody(indent: number) {
		var body = ""
		for (let i = 0; i < this.body.length; i++) {
			const e = this.body[i]
			body += e.emit(indent)
			if (i != this.body.length - 1) {
				body += "\n"
			}
		}
		return body
	}

	pushExpression(statement: Expression) {
		this.body.push(statement)
	}

	isScope(): this is Scope {
		return true
	}
}
