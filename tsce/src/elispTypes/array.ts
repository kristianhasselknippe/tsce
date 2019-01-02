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
	type: string = "ArrayIndexer"
	constructor(readonly leftHand: Expression, readonly indexer: Expression) {
		super()
	}

	isArrayIndexer() { return true }

	emit(indent: number) {
		return `${tabs(indent)}(nth ${this.indexer.emit(0)} ${this.leftHand.emit(0)})`
	}

	emitQuoted(indent: number) {
		return `${tabs(indent)},(nth ${this.indexer.emit(0)} ${this.leftHand.emit(0)})`
	}
}

export class ElementIndexer extends Expression {
	type: string = "ElementIndexer"
	constructor(readonly leftHand: Expression, readonly indexer: Expression) {
		super()
	}

	emitLeft() {
		return this.leftHand.emit(0)
	}

	emitLeftAndRight() {
		return this.emitLeft() + " " + this.emitIndexer()
	}

	isElementIndexer() { return true }

	emitIndexer() {
		return `(intern ${this.indexer.emit(0)})`
	}

	emit(indent: number) {
		return `${tabs(indent)}(map-elt ${this.leftHand.emit(0)} ${this.emitIndexer()})`
	}

	emitQuoted(indent: number) {
		return `${tabs(indent)},(map-elt ${this.leftHand.emit(0)} ${this.emitIndexer()})`
	}
}

export class StringIndexer extends Expression {
	type: string = "StringIndexer"

	constructor(readonly leftHand: Expression, readonly indexer: Expression) {
		super()
	}

	isStringIndexer() { return true }

	emitIndexer(){
		const index = this.indexer.emit(0)
		return `${index} (+ ${index} 1)`
	}

	emit(indent: number) {
		return `${tabs(indent)}(substring ${this.leftHand.emit(0)} ${this.emitIndexer()})`
	}

	emitQuoted(indent: number) {
		return `${tabs(indent)},(substring ${this.leftHand.emit(0)} ${this.emitIndexer()})`
	}
}
