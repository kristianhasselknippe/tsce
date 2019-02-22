import { Expression, tabs, Node } from ".";

export class NewExpression extends Expression {
	type: string = "NewExpression"

	constructor(
		readonly leftHand: Expression,
		readonly args: Node[]
	) {
		super()
	}

	emitArgs() {
		return this.args.map(x => x.emit(0)).reduce((acc, curr) => acc + " " + curr, "")
	}

	emit(indent: number) {
		return `${tabs(indent)}(ts/new ${this.leftHand.emit(0)} ${this.emitArgs()})`
	}
}
