import { Expression, Node, tabs } from ".";

export class Scope extends Expression {
	type: string = 'Scope'

	body: Node[] = []

	constructor() {
		super()
	}

	toString() {
		return 'Scope(' + this.type
	}

	isBig() {
		return true
	}

	emitBody(indent: number, progn = true) {
		var body = ""
		if (this.body.length > 1 && progn) {
			indent++
			body += `${tabs(indent-1)}(progn\n`
		}
		for (let i = 0; i < this.body.length; i++) {
			const e = this.body[i]
			body += e.emit(indent)
			body += "\n"
		}
		if (this.body.length > 1 && progn) {
			body += `${tabs(indent-1)})\n`
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
