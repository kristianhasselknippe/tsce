import { Expression, Node, tabs } from ".";

export class Scope extends Expression {
	type: string = 'Scope'

	constructor(readonly body: Node[]) {
		super()
	}

	toString() {
		return 'Scope(' + this.type
	}

	isBig() {
		return true
	}

	emitBody(indent: number) {
		var body = ""
		if (this.body.length > 1) {
			body += `${tabs(indent)}(progn`
		}
		for (let i = 0; i < this.body.length; i++) {
			const e = this.body[i]
			body += e.emit(indent)
			if (i != this.body.length - 1) {
				body += "\n"
			}
		}
		if (this.body.length > 1) {
			body += `${tabs(indent)})`
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
