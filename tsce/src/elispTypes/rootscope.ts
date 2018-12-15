import { Scope } from ".";

export class RootScope extends Scope {
	type = "Root scope"
	constructor() {
		super([])
	}

	emit() {
		return this.emitBody(0)
	}
}
