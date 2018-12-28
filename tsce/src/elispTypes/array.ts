import { Expression, tabs } from ".";

export class ArrayLiteral extends Expression {
	constructor(readonly items: Expression[]) {
		super()
	}

	emitItems() {
		return this.items.reduce((prev, curr) => {
			return prev + " ," + curr.emit(0)
		}, "")
	}

	emitQuoted(indent: number) {
		return `${tabs(indent)} (${this.emitItems()})`
	}

	emit(indent: number) {
		return `${tabs(indent)} \`(${this.emitItems()})`
	}
}

export class ArrayIndexer extends Expression {
	constructor(readonly leftHand: Expression, readonly indexer: Expression) {
		super()
	}

	emit(indent: number) {
		return `${tabs(indent)}(nth ${this.indexer.emit(0)} ${this.leftHand.emit(0)})`
	}

	emitQuoted(indent: number) {
		return `${tabs(indent)},(nth ${this.indexer.emit(0)} ${this.leftHand.emit(0)})`
	}
}
