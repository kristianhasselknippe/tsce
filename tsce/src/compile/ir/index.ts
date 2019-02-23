import { SymbolTable } from "../symbolTable";
import { TableItem, NodeData } from "../parser";
import { CompilerDirective } from "../elispTypes/compilerDirective";
import * as ts from 'ts-morph'

type SymbolTableType = SymbolTable<TableItem<Node, NodeData>>

export abstract class Node {
	constructor(readonly symTable: SymbolTableType) {}

	print() {
		return 'Node'
	}
}

export abstract class Expression extends Node {
	constructor(symTable: SymbolTableType) {
		super(symTable)
	}
}

export class Identifier extends Node {
	constructor(symTable: SymbolTableType,
				readonly name: string) {
		super(symTable)
	}

	print() {
		return this.name
	}
}

export abstract class NamedDeclaration extends Node {
	constructor(symTable: SymbolTableType,
				readonly name: Identifier) {
		super(symTable)
	}
}

export class ArgumentDeclaration extends NamedDeclaration {
		constructor(symTable: SymbolTableType,
					name: Identifier,
					readonly initializer?: Expression) {
			super(symTable, name)
		}
}

export class FunctionDeclaration extends NamedDeclaration {
	constructor(symTable: SymbolTableType,
				name: Identifier,
				readonly args: ArgumentDeclaration[],
				readonly body: Node[],
				readonly docStrings: string[]) {
		super(symTable, name)
	}
}

export class VariableDeclaration extends NamedDeclaration {
	constructor(symTable: SymbolTableType,
				name: Identifier,
				readonly initializer?: Node) {
		super(symTable, name)
	}

	printInit() {
		if (this.initializer) {
			return this.initializer.print()
		}
		return ""
	}

	print() {
		return `Variable(${this.name.print()}: ${this.printInit()})`
	}
}

export class VariableDeclarationList extends Node {
		constructor(symTable: SymbolTableType,
					readonly variables: VariableDeclaration[]) {
		super(symTable)
		}

	print() {
		return this.variables.reduce((acc, curr) => `${acc}, ${curr.print()}`, "")
	}
}

export class Assignment extends Node {
	constructor(symTable: SymbolTableType,
				readonly left: Node,
				readonly right: Node) {
		super(symTable)
	}
}

export class BinaryExpr extends Node {
	constructor(symTable: SymbolTableType,
				readonly left: Node,
				readonly right: Node,
				readonly operator: string) {
		super(symTable)
	}
}

export class UnaryPrefix extends Node {
	constructor(symTable: SymbolTableType,
				readonly operand: Node,
				readonly operator: string) {
		super(symTable)
	}
}

export class UnaryPostfix extends Node {
	constructor(symTable: SymbolTableType,
				readonly operand: Node,
				readonly operator: string) {
		super(symTable)
	}
}

export class DeleteExpression extends Node {
	constructor(symTable: SymbolTableType,
				readonly expr: Node) {
		super(symTable)
	}
}

export class EnumMember extends Node {
	constructor(symTable: SymbolTableType,
				readonly name: Identifier | StringLiteral,
				readonly initializer?: Node) {
		super(symTable)
	}
}

export class EnumDeclaration extends NamedDeclaration {
	constructor(symTable: SymbolTableType,
				name: Identifier,
				readonly members: EnumMember[]) {
		super(symTable, name)
	}
}

export class ArrayLiteral extends Node {
	constructor(symTable: SymbolTableType,
				readonly items: Node[]) {
		super(symTable)
	}
}

export enum ElementIndexerType {
	Number,
	String
}

export enum ElementType {
	Array,
	String,
	Object
}

export class ElementAccess extends Node {
	constructor(symTable: SymbolTableType,
				readonly left: Node,
				readonly indexer: Node,
				readonly elementType: ElementType,
				readonly indexerType: ElementIndexerType) {
		super(symTable)
	}
}

export class PropertyAccess extends Node {
	constructor(symTable: SymbolTableType,
				readonly left: Node,
				readonly right: Node) {
		super(symTable)
	}
}

export class ObjectProperty extends Node {
	constructor(symTable: SymbolTableType,
				readonly name: Identifier,
				readonly value: Node) {
		super(symTable)
	}
}

export class ObjectLiteral extends Node {
	constructor(symTable: SymbolTableType,
				readonly properties: ObjectProperty[]) {
		super(symTable)
	}
}

export class StringLiteral extends Node {
	constructor(symTable: SymbolTableType,
				readonly value: string) {
		super(symTable)
	}

	print() {
		return this.value
	}
}

export class NumberLiteral extends Node {
	constructor(symTable: SymbolTableType,
				readonly value: string) {
		super(symTable)
	}

	print() {
		return this.value
	}
}

export class BooleanLiteral extends Node {
	constructor(symTable: SymbolTableType,
				readonly value: boolean) {
		super(symTable)
	}

	print() {
		return this.value.toString()
	}
}

export class Block extends Node {
	constructor(symTable: SymbolTableType,
				readonly statements: Node[]) {
		super(symTable)
	}
}

export class CallExpression extends Expression {
	constructor(symTable: SymbolTableType,
				readonly typescriptNode: ts.CallExpression,
				readonly expression: Expression,
				readonly args: Node[]) {
		super(symTable)
	}
}

export class If extends Node {
	constructor(symTable: SymbolTableType,
				readonly thenCondition: Node,
				readonly thenBlock: Node,
				readonly elseItem?: If | Node,) {
		super(symTable)
	}
}

export class ConditionalExpression extends Node {
	constructor(symTable: SymbolTableType,
				readonly condition: Expression,
				readonly whenTrue: Expression,
				readonly whenFalse: Expression) {
		super(symTable)
	}
}

export class For extends Node {
	constructor(symTable: SymbolTableType,
				readonly body: Node,
				readonly initializer?: VariableDeclaration,
				readonly condition?: Node,
				readonly incrementor?: Node) {
		super(symTable)
	}
}

export class ForOf extends Node {
	constructor(symTable: SymbolTableType,
				readonly variable: VariableDeclaration,
				readonly expression: Node,
				readonly body: Node) {
		super(symTable)
	}
}

export class ForIn extends Node {
	constructor(symTable: SymbolTableType,
				readonly variable: VariableDeclaration,
				readonly expression: Node,
				readonly body: Node) {
		super(symTable)
	}
}

export class While extends Node {
	constructor(symTable: SymbolTableType,
				readonly condition: Node,
				readonly body: Block) {
		super(symTable)
	}
}

export class ArrowFunction extends Node {
	constructor(symTable: SymbolTableType,
				readonly args: ArgumentDeclaration[],
				readonly body: Node[]) {
		super(symTable)
	}
}

export class ReturnStatement extends Node {
	constructor(symTable: SymbolTableType,
				readonly returnValue?: Node) {
		super(symTable)
	}
}

abstract class Import extends Node {
	constructor(symTable: SymbolTableType,
				readonly path: StringLiteral) {
		super(symTable)
	}

}

export class NamedImport extends Import {
	constructor(symTable: SymbolTableType,
				path: StringLiteral,
				readonly items: Identifier[],
				readonly defaultItem?: Identifier) {
		super(symTable, path)
	}
}

export class NamespaceImport extends Import {
	constructor(symTable: SymbolTableType,
				path: StringLiteral,
				readonly variable: Identifier) {
		super(symTable, path)
	}
}

export class ModuleDeclaration extends Node {
	constructor(symTable: SymbolTableType,
				readonly name: string) {
		super(symTable)
	}
}

export class Null extends Node {
	
}

export class SourceFile extends Block {

	constructor(
		readonly filePath: string,
		symTable: SymbolTableType,
		readonly statements: Node[]) {
		super(symTable, statements)
	}
	
	printAst() {
		for (const i of this.statements) {
			if (i) {
				console.log(i.print())
			} else {
				console.log("- undefined item")
			}
		}
	}
}
