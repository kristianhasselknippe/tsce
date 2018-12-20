import { Expression, tabs } from ".";

export abstract class Literal<T> extends Expression {
	type = 'Literal'
}

export class BooleanLiteral extends Literal<boolean> {
	type: string  = 'BooleanLiteral'
	constructor(readonly val: boolean) {
		super();
	}

	emitAsString(indent: number) {
		return this.val ? 't' : "'nil"
	}

	emit(indent: number) {
		return tabs(indent) + (this.val ? 't' : "'nil");
	}
}

export class NumberLiteral extends Literal<number> {
	type: string = 'NumberLiteral'

	constructor(readonly num: string) {
		super();
	}

	emitAsString(indent: number) {
		return `${tabs(indent)}(number-to-string ${this.num})`
	}

	emit(indent: number) {
		return tabs(indent) + this.num;
	}
}

export class StringLiteral extends Literal<string> {
	type: string = 'StringLiteral'
	constructor(readonly str: string) {
		super();
	}

	emit(indent: number) {
		return tabs(indent) + ('"' + this.str + '"');
	}

	emitWith(indent: number, stringToConcat: string) {
		return tabs(indent) + ('"' + this.str + stringToConcat + '"');
	}
}
