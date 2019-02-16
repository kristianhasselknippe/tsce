import { Expression, Node, tabs } from ".";

export abstract class Scope extends Expression {
	type: string = 'Scope'

	body: Node[] = []

	add(stmt: Node) {
		this.body.push(stmt)
	}

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
			if (e) {
				body += e.emit(indent)
				body += "\n"
			}
		}
		if (this.body.length > 1 && progn) {
			body += `${tabs(indent-1)})\n`
		}
		return body
	}

	emit(indent: number) {
		let progn = false
		if (this.body.length > 1) {
			progn = true
		}
		return this.emitBody(indent, progn)
	}

	isScope(): this is Scope {
		return true
	}
}
