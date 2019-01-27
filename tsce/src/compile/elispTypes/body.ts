import { Scope, Node, tabs, Expression } from ".";
import { Declaration } from "./declaration";

//TODO: Body shouldn't be a scope. It is just an array of statements
export class Body extends Scope {
	type: string = 'Body'
	constructor() {
		super()
	}

	getDeclarations(): (Node & Declaration)[] {
		return []
	}

	emit(indent: number) {
		return this.emitBody(indent)
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
}
