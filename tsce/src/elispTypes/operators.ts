import * as ts from 'typescript'
import { Expression, tabs } from ".";

let operatorsMap = {
	'==': 'equal',
	'===': 'equal',
	'!=': '/=',
	'!==': '/=',
	'!': 'not',
	'&&': 'and',
	'||': 'or'
} as { [index: string]: string };

export class BinaryExpression extends Expression {
	type: string = 'BinaryExpression'
	operator: string;

	constructor(
		op: string,
		readonly left: Expression,
		readonly right: Expression
	) {
		super();
		if (op in operatorsMap) {
			this.operator = operatorsMap[op];
		} else {
			this.operator = op;
		}
	}

	emitQuoted(indent: number) {
		return this.emit(indent, true)
	}

	emit(indent: number, quoted = false) {
		let operatorFunc = this.operator
		if (this.operator === "+") {
			operatorFunc = "ts/+"
		}
		const unquote = quoted ? ',' : ''
		return `${tabs(indent)}${unquote}(${operatorFunc} ${this.left.emit(0)} ${this.right.emit(0)})`
	}
}


abstract class UnaryExpression extends Expression {
	constructor(readonly operator: string,
				readonly operand: Expression) {
		super()
	}
}

export class UnaryPrefixExpression extends UnaryExpression {
	type: string = 'UnaryPrefixExpression'

	constructor(op: string, operand: Expression) {
		super(operatorsMap[op], operand)
	}

	emitQuoted(indent: number) {
		return this.emit(indent, true)
	}

	emit(indent: number, quoted = false) {
		const unquote = quoted ? ',' : ''
		return `${tabs(indent)}${unquote}(${this.operator} ${this.operand.emit(0)})`
	}
}

const unaryPostFixOps: any = {
	[ts.SyntaxKind.PlusPlusToken]: "1+",
	[ts.SyntaxKind.MinusMinusToken]: "1-"
}

export class UnaryPostfixExpression extends UnaryExpression {
	type: string = "UnaryPostfixExpression"

	constructor(op: number, operand: Expression) {
		super(unaryPostFixOps[op], operand)
	}

	emitQuoted(indent: number) {
		return this.emit(indent, true)
	}

	emit(indent: number, quoted = false) {
		const unquote = quoted ? ',' : ''
		const operandStr = this.operand.emit(0)
		return `${tabs(indent)}${unquote}(setq ${operandStr} (${this.operator} ${operandStr}))`
	}
}
