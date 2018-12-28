import { Scope } from ".";

export class RootScope extends Scope {
	type = "RootScope"
	constructor() {
		super([])
	}

	emit() {
		return this.emitBody(0)
	}
}
