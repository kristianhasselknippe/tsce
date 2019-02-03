import { SymbolTable } from "../symbolTable";

export abstract class Node {
	constructor(readonly symTable: SymbolTable<Node>) {}

	print(indent: number) {
		console.log(" - " + (this.constructor as any).name)
	}
}

export abstract class Expression extends Node {
	constructor(symTable: SymbolTable<Node>) {
		super(symTable)
	}
}

export class Identifier extends Node {
	constructor(symTable: SymbolTable<Node>,
				readonly name: string) {
		super(symTable)
	}
}

export abstract class NamedDeclaration extends Node {
	constructor(symTable: SymbolTable<Node>,
				readonly name: Identifier) {
		super(symTable)
	}
}

export class FunctionDeclaration extends NamedDeclaration {
	constructor(symTable: SymbolTable<Node>,
				name: Identifier,
				readonly args: Identifier[],
				readonly body: Node[]) {
		super(symTable, name)
	}
}

export class VariableDeclaration extends NamedDeclaration {
	constructor(symTable: SymbolTable<Node>,
				name: Identifier,
				readonly initializer?: Node) {
		super(symTable, name)
	}
}

export class VariableDeclarationList extends Node {
		constructor(symTable: SymbolTable<Node>,
					readonly variables: VariableDeclaration[]) {
		super(symTable)
	}
}

export class Assignment extends Node {
	constructor(symTable: SymbolTable<Node>,
				readonly left: Node,
				readonly right: Node) {
		super(symTable)
	}
}

export class BinaryExpr extends Node {
	constructor(symTable: SymbolTable<Node>,
				readonly left: Node,
				readonly right: Node,
				readonly operator: string) {
		super(symTable)
	}
}

export class UnaryPrefix extends Node {
	constructor(symTable: SymbolTable<Node>,
				readonly operand: Node,
				readonly operator: string) {
		super(symTable)
	}
}

export class UnaryPostfix extends Node {
	constructor(symTable: SymbolTable<Node>,
				readonly operand: Node,
				readonly operator: string) {
		super(symTable)
	}
}

export class DeleteExpression extends Node {
	constructor(symTable: SymbolTable<Node>,
				readonly expr: Node) {
		super(symTable)
	}
}

export class EnumMember extends Node {
	constructor(symTable: SymbolTable<Node>,
				readonly name: Identifier | StringLiteral,
				readonly initializer?: Node) {
		super(symTable)
	}
}

export class EnumDeclaration extends NamedDeclaration {
	constructor(symTable: SymbolTable<Node>,
				name: Identifier,
				readonly members: EnumMember[]) {
		super(symTable, name)
	}
}

export class ArrayLiteral extends Node {
	constructor(symTable: SymbolTable<Node>,
				readonly items: Node[]) {
		super(symTable)
	}
}

export class ElementAccess extends Node {
	constructor(symTable: SymbolTable<Node>,
				readonly left: Node,
				readonly indexer: Node) {
		super(symTable)
	}
}

export class PropertyAccess extends Node {
	constructor(symTable: SymbolTable<Node>,
				readonly left: Node,
				readonly right: Node) {
		super(symTable)
	}
}

export class ObjectProperty extends Node {
	constructor(symTable: SymbolTable<Node>,
				readonly name: Identifier,
				readonly value: Node) {
		super(symTable)
	}
}

export class ObjectLiteral extends Node {
	constructor(symTable: SymbolTable<Node>,
				readonly properties: ObjectProperty[]) {
		super(symTable)
	}
}

export class StringLiteral extends Node {
	constructor(symTable: SymbolTable<Node>,
				readonly value: string) {
		super(symTable)
	}
}

export class NumberLiteral extends Node {
	constructor(symTable: SymbolTable<Node>,
				readonly value: string) {
		super(symTable)
	}
}

export class BooleanLiteral extends Node {
	constructor(symTable: SymbolTable<Node>,
				readonly value: boolean) {
		super(symTable)
	}
}

export class Block extends Node {
	constructor(symTable: SymbolTable<Node>,
				readonly statements: Node[]) {
		super(symTable)
	}
}

export class CallExpression extends Expression {
	constructor(symTable: SymbolTable<Node>,
				readonly expression: Expression,
				readonly args: Node[]) {
		super(symTable)
	}
}

export class If extends Node {
	constructor(symTable: SymbolTable<Node>,
				readonly thenCondition: Node,
				readonly thenBlock: Node,
				readonly elseItem?: If | Node,) {
		super(symTable)
	}
}

export class For extends Node {
	constructor(symTable: SymbolTable<Node>,
				readonly body: Node,
				readonly initializer?: VariableDeclaration,
				readonly condition?: Node,
				readonly incrementor?: Node) {
		super(symTable)
	}
}

export class ForOf extends Node {
	constructor(symTable: SymbolTable<Node>,
				readonly variable: VariableDeclaration,
				readonly expression: Node,
				readonly body: Node) {
		super(symTable)
	}
}

export class ForIn extends Node {
	constructor(symTable: SymbolTable<Node>,
				readonly variable: VariableDeclaration,
				readonly expression: Node,
				readonly body: Node) {
		super(symTable)
	}
}

export class While extends Node {
	constructor(symTable: SymbolTable<Node>,
				readonly condition: Node,
				readonly body: Block) {
		super(symTable)
	}
}

export class ArrowFunction extends Node {
	constructor(symTable: SymbolTable<Node>,
				readonly args: Identifier[],
				readonly body: Node[]) {
		super(symTable)
	}
}

export class ReturnStatement extends Node {
	constructor(symTable: SymbolTable<Node>,
				readonly returnValue?: Node) {
		super(symTable)
	}
}

abstract class Import extends Node {
	constructor(symTable: SymbolTable<Node>,
				readonly path: StringLiteral) {
		super(symTable)
	}

}

export class NamedImport extends Import {
	constructor(symTable: SymbolTable<Node>,
				path: StringLiteral,
				readonly items: Identifier[],
				readonly defaultItem?: Identifier) {
		super(symTable, path)
	}
}

export class NamespaceImport extends Import {
	constructor(symTable: SymbolTable<Node>,
				path: StringLiteral,
				readonly variable: Identifier) {
		super(symTable, path)
	}
}

export class ModuleDeclaration extends Node {
	constructor(symTable: SymbolTable<Node>,
				readonly name: string) {
		super(symTable)
	}
}

export class Null extends Node {
	
}

export class SourceFile extends Block {
	printAst() {
		for (const i of this.statements) {
			if (i) {
				i.print(0)
			} else {
				console.log("- undefined item")
			}
		}
	}
}
