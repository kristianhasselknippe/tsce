import { Scope } from ".";

export class Body extends Scope {
	type: string = 'Body'
	constructor() {
		super()
	}

	emit(indent: number) {
		return this.emitBody(indent)
	}
}
