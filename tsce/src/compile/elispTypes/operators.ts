import { ts } from 'ts-morph'
import { Expression, tabs, generateTempBindingName } from ".";

let operatorsMap = {
	'==': 'equal',
	'===': 'equal',
	'!=': '/=',
	'!==': '/=',
	'!': 'not',
	'&&': 'and',
	'||': 'or'
} as { [index: string]: string };

let assignOperators = [
	'+=',
	'-=',
	'*=',
	'/='
]

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
		if (assignOperators.indexOf(this.operator) !== -1) {
			return `${tabs(indent)}(setf ${this.left.emit(0)} (${this.operator[0]} ${this.left.emit(0)} ${this.right.emit(0)}))`
		} else {
			let operatorFunc = this.operator
			if (this.operator === "+") {
				operatorFunc = "ts/+"
			}
			const unquote = quoted ? ',' : ''
			return `${tabs(indent)}${unquote}(${operatorFunc} ${this.left.emit(0)} ${this.right.emit(0)})`
		}
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

	constructor(readonly op: string, operand: Expression) {
		super(operatorsMap[op], operand)
	}

	emitQuoted(indent: number) {
		return this.emit(indent, true)
	}

	emit(indent: number, quoted = false) {
		if (this.op === '-') {
			return `${tabs(indent)}-${this.operand.emit(0)}`
		}
		const unquote = quoted ? ',' : ''
		return `${tabs(indent)}${unquote}(${this.operator} ${this.operand.emit(0)})`
	}
}

const unaryPostFixOps: any = {
	[0]: "1+",
	[1]: "1-"
}

export enum UnaryPostfixOp {
	PlusPlus = 0,
	MinusMinus = 1
}

export class UnaryPostfixExpression extends UnaryExpression {
	type: string = "UnaryPostfixExpression"

	constructor(op: UnaryPostfixOp, operand: Expression) {
		super(unaryPostFixOps[op], operand)
	}

	emitQuoted(indent: number) {
		return this.emit(indent, true)
	}

	emit(indent: number, quoted = false) {
		const unquote = quoted ? ',' : ''
		const operandStr = this.operand.emit(0)
		const tempBinding = generateTempBindingName()
		return `${tabs(indent)}${unquote}(let ((${tempBinding} ${operandStr})) (setf ${operandStr} (${this.operator} ${operandStr})) ${tempBinding})`
	}
}
