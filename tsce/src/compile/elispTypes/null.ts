import { Expression } from ".";

export class Null extends Expression {
	emit(_indent: number) {
		return "'nil"
	}
}
