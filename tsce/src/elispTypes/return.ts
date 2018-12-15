import { Expression, tabs } from ".";

export class ReturnStatement extends Expression {
	type: string = 'ReturnStatement'

	constructor(readonly parentFunction: string, readonly value?: Expression) {
		super()
	}

	emit(indent: number) {
		let retVal = ""
		if (this.value) {
			retVal = this.value.emit(0)
		}
		return `${tabs(indent)}(cl-return-from ${this.parentFunction} ${retVal})`
	}
}
