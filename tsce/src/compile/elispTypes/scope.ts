import { Expression, Node, tabs } from ".";
import { Declaration } from "./declaration";

export abstract class Scope extends Expression {
	type: string = 'Scope'

	constructor(readonly body: Node[] | Node) {
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
		if (this.body instanceof Array) {
			var body = ""
			if (this.body.length > 1 && progn) {
				indent++
				body += `${tabs(indent-1)}(progn\n`
			}
			for (let i = 0; i < this.body.length; i++) {
				const e = this.body[i]
				if (e) {
					body += e.emit(indent)
					body += "\n"
				}
			}
			if (this.body.length > 1 && progn) {
				body += `${tabs(indent-1)})\n`
			}
			return body
		} else {
			return this.body.emit(indent)
		}
	}

	emit(indent: number) {
		return this.emitBody(indent, false)
	}

	isScope(): this is Scope {
		return true
	}
}
