import { Scope, Node, tabs, Expression } from ".";
import { Declaration } from "./declaration";

//TODO: Body shouldn't be a scope. It is just an array of statements
export class Body extends Scope {
	type: string = 'Body'
	constructor(body: Node[] | Node) {
		super(body)
	}

	getDeclarations(): (Node & Declaration)[] {
		return []
	}

	emit(indent: number) {
		return this.emitBody(indent)
	}

	emitBody(indent: number, progn = true) {
		let ret = ""
		if (this.body instanceof Array) {
			if (this.body.length > 1 && progn) {
				indent++
				ret += `${tabs(indent-1)}(progn\n`
			}
			for (let i = 0; i < this.body.length; i++) {
				const e = this.body[i]
				if (e) {
					ret += e.emit(indent)
					ret += "\n"
				}
			}
			if (this.body.length > 1 && progn) {
				ret += `${tabs(indent-1)})\n`
			}
		} else if (this.body) {
			ret += this.body.emit(0)
		}
		return ret
	}
}
