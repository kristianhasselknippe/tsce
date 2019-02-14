import { Scope, tabs } from ".";

//TODO: Body shouldn't be a scope. It is just an array of statements
export class Body extends Scope {
	type: string = 'Body'
	constructor() {
		super()
	}

	emit(indent: number) {
		return this.emitBody(indent)
	}

	emitBody(indent: number, progn = true) {
		let ret = ""
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
		return ret
	}
}
