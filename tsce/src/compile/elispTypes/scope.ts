import { Expression, Node, tabs } from ".";
import { Declaration } from "./declaration";

export abstract class Scope extends Expression {
	type: string = 'Scope'

	body: Node[] = []

	constructor() {
		super()
	}

	getDeclarationOfIdentifier(identifierName: string): Node | undefined {
		const decls = this.getDeclarations()
		for (const decl of decls) {
			if (decl.matchesIdentifier(identifierName)) {
				return decl
			}
		}
	}

	abstract getDeclarations(): (Node & Declaration)[]

	toString() {
		return 'Scope(' + this.type
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

	emit(indent: number) {
		return this.emitBody(indent, false)
	}

	pushExpression(statement: Expression) {
		this.body.push(statement)
	}

	isScope(): this is Scope {
		return true
	}
}
