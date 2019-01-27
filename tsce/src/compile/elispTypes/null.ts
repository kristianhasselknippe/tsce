import { Expression } from ".";

export class Null extends Expression {
	emit(indent: number) {
		return "'nil"
	}
}
