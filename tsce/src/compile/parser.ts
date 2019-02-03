import {
	ts,
	Node,
	ArrowFunction,
	ForStatement,
	PropertyAssignment,
	ForOfStatement,
	Block,
	IfStatement,
	Identifier,
	FunctionDeclaration,
	CallExpression,
	ExpressionStatement,
	VariableDeclaration,
	VariableDeclarationList,
	VariableStatement,
	EnumDeclaration,
	BinaryExpression,
	ParenthesizedExpression,
	PostfixUnaryExpression,
	PrefixUnaryExpression,
	DeleteExpression,
	ReturnStatement,
	ElementAccessExpression,
	ArrayLiteralExpression,
	ObjectLiteralExpression,
	ShorthandPropertyAssignment,
	PropertyAccessExpression,
	TypeAssertion,
	AsExpression,
	ImportDeclaration,
	TypeGuards,
	NamespaceImport,
	StringLiteral,
	NamespaceDeclaration,
	SourceFile} from 'ts-simple-ast';
import { SymbolTable } from "./symbolTable";
import * as IR from './ir'

class ParserBase<T> {
	private symTable: SymbolTable<T> = new SymbolTable()

	get symbols() {
		return this.symTable
	}

	insertSymbol(name: string, node: T): T {
		return this.symTable.insert(name, node)
	}

	enterScope(name: string, body: () => T) {
		this.symTable = this.symTable.enterScope()
		const item = body()
		this.symTable = this.symTable.parent
		this.insertSymbol(name, item)
		return item
	}

	enterAnonymousScope(body: () => T) {
		this.symTable = this.symTable.enterScope()
		const item = body()
		this.symTable = this.symTable.parent
		return item
	}
}

export class Parser extends ParserBase<IR.Node> {

	private parseExpressionStatement(es: ExpressionStatement) {
		return this.parse<IR.Expression>(es.getExpression());
	}

	private parseCallExpression(ce: CallExpression) {
		const leftHand = this.parse<IR.Expression>(ce.getExpression());
		const args = ce.getArguments().map(a => {
			return this.parse<IR.Expression>(a);
		});
		return new IR.CallExpression(this.symbols, leftHand, args)
	}

	private parseVariableDeclaration(vd: VariableDeclaration) {
		const identifier = this.parse<IR.Identifier>(
			vd.getNameNode()
		);
		let initializer;
		if (vd.getInitializer()) {
			initializer = this.parse<IR.Expression>(
				vd.getInitializer()!
			);
		}
		return this.insertSymbol(identifier.name, new IR.VariableDeclaration(
			this.symbols,
			identifier,
			initializer
		))
	}

	private parseVariableDeclarationList(vdl: VariableDeclarationList) {
		const bindings = vdl.getDeclarations().map(x => this.parse<IR.VariableDeclaration>(x))
		return new IR.VariableDeclarationList(this.symbols, bindings);
	}

	private parseFunctionDeclaration(fd: FunctionDeclaration) {
		const functionIdentifier = this.parse<IR.Identifier>(
			fd.getNameNode()!
		);

		return this.enterScope(functionIdentifier.name, () => {
			let args = fd
				.getParameters()
				.map(p => p.getNameNode())
				.filter(x => typeof x !== 'undefined')
				.map(x => this.parse<IR.Identifier>(x!))

			for (const a of args) {
				this.insertSymbol(a.name, a)
			}

			let statements = fd.getStatements().map(x => {
				return this.parse<IR.Node>(x);
			})

			return new IR.FunctionDeclaration(
				this.symbols,
				functionIdentifier,
				args,
				statements
			)
		})
	}

	private parseVariableStatement(vs: VariableStatement) {
		return this.parse(vs.getDeclarationList());
	}

	private parseEnumDeclaration(enumDecl: EnumDeclaration) {
		const name = this.parse<IR.Identifier>(
			enumDecl.getNameNode()
		);
		const props = enumDecl.getMembers().map(x => {
			const propName = this.parse<IR.Identifier | IR.StringLiteral>(x.getNameNode());
			let initializer;
			if (x.hasInitializer()) {
				initializer = this.parse<IR.Expression>(
					x.getInitializer()!
				);
			}
			return new IR.EnumMember(this.symbols, propName, initializer);
		})
		return new IR.EnumDeclaration(
			this.symbols,
			name,
			props
		);
	}

	private parseIdentifier(identifierNode: Identifier) {
		return new IR.Identifier(this.symbols, identifierNode.getText())
	}

	private parseParenthesizedExpression(pe: ParenthesizedExpression) {
		return this.parse(pe.getExpression());
	}

	private parseBinaryExpression(be: BinaryExpression) {
		const left = this.parse<IR.Expression>(be.getLeft());
		const right = this.parse<IR.Expression>(be.getRight());

		let op = be.getOperatorToken().getText()
		if (op === '=') {
			return new IR.Assignment(this.symbols, left, right)
		} else {
			return new IR.BinaryExpr(this.symbols, left, right, op)
		}
	}

	private parsePostfixUnaryExpression(pue: PostfixUnaryExpression) {
		const operator = ts.tokenToString(pue.getOperatorToken());
		const operand = this.parse<IR.Node>(pue.getOperand());
		return new IR.UnaryPostfix(this.symbols, operand, operator!)
	}

	private parsePrefixUnaryExpression(pue: PrefixUnaryExpression) {
		let operator = ts.tokenToString(pue.getOperatorToken());
		const operand = this.parse<IR.Expression>(pue.getOperand());
		return new IR.UnaryPrefix(this.symbols, operand, operator!);
	}

	private parseDeleteExpression(delExpr: DeleteExpression) {
		const expr = this.parse<IR.Expression>(
			delExpr.getExpression()
		);
		return new IR.DeleteExpression(this.symbols, expr);
	}

	private parseFalseKeyword() {
		return new IR.BooleanLiteral(this.symbols, false);
	}

	private parseTrueKeyword() {
		return new IR.BooleanLiteral(this.symbols, true)
	}

	private parseIfStatement(ifExp: IfStatement) {
		const predicate = this.parse<IR.Expression>(
			ifExp.getExpression()
		);

		const thenStatementBody = this.parse<IR.Node>(ifExp.getThenStatement());

		let elseIf: IR.Node | undefined
		const elseStatement = ifExp.getElseStatement()
		if (elseStatement) {
			if (ifExp.getElseStatement()) {
				elseIf = this.parse<IR.If>(ifExp.getElseStatement()!)
			} else {
				const elseStatement = ifExp.getElseStatement();
				if (elseStatement) {
					elseIf = this.parse<IR.Node>(elseStatement);
				}
			}
		}
		return new IR.If(this.symbols, predicate, thenStatementBody, elseIf);
	}

	private parseReturnStatement(retStatement: ReturnStatement) {
		let returnValue;
		if (retStatement.getExpression()) {
			returnValue = this.parse<IR.Node>(
				retStatement.getExpression()!
			);
		}
		return new IR.ReturnStatement(this.symbols, returnValue)
	}

	private parseForOfStatement(forOf: ForOfStatement) {
		const variableInitializer = this.parse<IR.VariableDeclaration>(forOf.getInitializer());
		const loopExpression = this.parse<IR.Node>(forOf.getExpression());
		const body = this.parse<IR.Node>(forOf.getStatement())
		return new IR.ForOf(this.symbols, variableInitializer, loopExpression, body)
	}

	private parseForStatement(forStatement: ForStatement) {
		const init = this.parse<IR.VariableDeclaration | undefined>(forStatement.getInitializer());
		const condition = this.parse<IR.Node | undefined>(forStatement.getCondition());
		const incrementor = this.parse<IR.Node | undefined>(forStatement.getIncrementor());

		const body = this.parse<IR.Node>(forStatement.getStatement())
		return new IR.For(this.symbols, body, init, condition, incrementor)
	}

	private parseElementAccess(indexer: ElementAccessExpression) {
		const left = this.parse<IR.Node>(indexer.getExpression())
		const index = this.parse<IR.Node>(indexer.getArgumentExpression()!);
		return new IR.ElementAccess(this.symbols, left, index)
	}

	private parseArrayLiteralExpression(arrayLiteral: ArrayLiteralExpression) {
		const items = arrayLiteral.getElements().map(x => this.parse<IR.Node>(x))
		return new IR.ArrayLiteral(this.symbols, items);
	}

	private parseObjectLiteralExpression(objectLiteral: ObjectLiteralExpression) {
		const properties = [];
		for (const property of objectLiteral.getProperties()) {
			switch (property.getKind()) {
				case ts.SyntaxKind.PropertyAssignment:
					{
						const assignment = <PropertyAssignment>property;

						const identifier = this.parse<IR.Identifier>(assignment.getNameNode());
						const initializer = this.parse<IR.Node>(assignment.getInitializer()!);

						properties.push(
							new IR.ObjectProperty(
								this.symbols,
								identifier,
								initializer
							)
						);
					}
					break;
				case ts.SyntaxKind.ShorthandPropertyAssignment:
					{
						const shorthand = <ShorthandPropertyAssignment>property;
						const identifier = this.parse<IR.Identifier>(shorthand.getNameNode());
						properties.push(
							new IR.ObjectProperty(
								this.symbols,
								identifier,
								identifier
							)
						);
					}
					break;
				case ts.SyntaxKind.SpreadAssignment: {
					throw new Error(
						'Spread operator not currently supported'
					);
				}
			}
		}
		return new IR.ObjectLiteral(this.symbols, properties);
	}

	private parsePropertyAccessExpression(propAccess: PropertyAccessExpression) {
		const left = this.parse<IR.Node>(propAccess.getExpression());
		const right = this.parse<IR.Identifier>(propAccess.getNameNode());
		return new IR.PropertyAccess(this.symbols, left, right)
	}

	private parseImportDeclaration(importDecl: ImportDeclaration) {
		const moduleName = this.parse<IR.StringLiteral>(importDecl.getModuleSpecifier())

		if (importDecl.getImportClause()) {
			const namedBindings = importDecl.getImportClause()!.getNamedBindings();
			if (namedBindings) {
				if (TypeGuards.isNamespaceImport(namedBindings)) {
					const namespaceImport = <NamespaceImport>(namedBindings);
					const namespaceIdentifier = this.parse<IR.Identifier>(namespaceImport.getNameNode());
					return new IR.NamespaceImport(this.symbols, moduleName, namespaceIdentifier)
				} else if (TypeGuards.isNamedImports(namedBindings)) {
					//TODO: Also handle the default import item
					const elements = namedBindings.getElements().map(x => {
						return this.parse<IR.Identifier>(x.getNameNode())
					})
					return new IR.NamedImport(this.symbols, moduleName, elements)
				}
			}
		}
	}

	private parseArrowFunction(arrowFunc: ArrowFunction) {
		return this.enterAnonymousScope(() => {
			let params = arrowFunc
				.getParameters()
				.map(p => p.getNameNode())
				.filter(x => typeof x !== 'undefined')
				.map(x => this.parse<IR.Identifier>(x!))
			for (const param of params) {
				this.insertSymbol(param.name, param)
			}
			const body = this.parse<IR.Node>(arrowFunc.getBody())
			return new IR.ArrowFunction(this.symbols, params, [body])
		})
	}

	private parseNamespaceExportDeclaration(mod: NamespaceDeclaration) {
		let name = mod.getName();
		if (name.indexOf('"') > -1 || name.indexOf("'") > -1) {
			name = name.substring(1, name.length - 1);
		}
		return new IR.ModuleDeclaration(this.symbols, name);
	}

	private parseNullKeyword() {
		return new IR.Null(this.symbols);
	}

	private parse<T extends (IR.Node | undefined)>(node?: Node): T {
		if (typeof node === "undefined") {
			return undefined as T
		}
		const ret = (() => {
			//context.printAtStackOffset(node.getKindName(), node);
			switch (node.getKind()) {
				case ts.SyntaxKind.ExpressionStatement:
					return this.parseExpressionStatement(<ExpressionStatement>node);
				case ts.SyntaxKind.CallExpression:
					return this.parseCallExpression(<CallExpression>node);
				case ts.SyntaxKind.VariableDeclaration:
					return this.parseVariableDeclaration(<VariableDeclaration>node);
				case ts.SyntaxKind.VariableDeclarationList:
					return this.parseVariableDeclarationList(<VariableDeclarationList>(
						node
					));
				case ts.SyntaxKind.VariableStatement:
					return this.parseVariableStatement(<VariableStatement>node);
				case ts.SyntaxKind.FunctionDeclaration:
					return this.parseFunctionDeclaration(<FunctionDeclaration>node);
				case ts.SyntaxKind.EnumDeclaration:
					return this.parseEnumDeclaration(<EnumDeclaration>node);
				case ts.SyntaxKind.Identifier:
					return this.parseIdentifier(<Identifier>node);
				case ts.SyntaxKind.ParenthesizedExpression:
					return this.parseParenthesizedExpression(<ParenthesizedExpression>(
						node
					));
				case ts.SyntaxKind.BinaryExpression:
					return this.parseBinaryExpression(<BinaryExpression>node);
				case ts.SyntaxKind.PostfixUnaryExpression:
					return this.parsePostfixUnaryExpression(<PostfixUnaryExpression>(
						node
					));
				case ts.SyntaxKind.PrefixUnaryExpression:
					return this.parsePrefixUnaryExpression(<PrefixUnaryExpression>(
						node
					));
				case ts.SyntaxKind.DeleteExpression:
					return this.parseDeleteExpression(<DeleteExpression>node);
				case ts.SyntaxKind.FalseKeyword:
					return this.parseFalseKeyword();
				case ts.SyntaxKind.TrueKeyword:
					return this.parseTrueKeyword();
				case ts.SyntaxKind.NumericLiteral:
					return new IR.NumberLiteral(this.symbols, node.getText())
				case ts.SyntaxKind.StringLiteral:
					const stringLiteral = <StringLiteral>node;
					return new IR.StringLiteral(this.symbols, stringLiteral.getLiteralValue())
				case ts.SyntaxKind.IfStatement:
					return this.parseIfStatement(<IfStatement>node);
				case ts.SyntaxKind.ReturnStatement:
					return this.parseReturnStatement(<ReturnStatement>node)
				case ts.SyntaxKind.Block:
					const block = <Block>node;
					return new IR.Block(this.symbols, block.getStatements().map(x => this.parse<IR.Node>(x)))
				case ts.SyntaxKind.ForOfStatement:
					return this.parseForOfStatement(<ForOfStatement>node)
				case ts.SyntaxKind.ForStatement:
					return this.parseForStatement(<ForStatement>node)
				case ts.SyntaxKind.ElementAccessExpression:
					return this.parseElementAccess(<ElementAccessExpression>node)
				case ts.SyntaxKind.ArrayLiteralExpression:
					return this.parseArrayLiteralExpression(<ArrayLiteralExpression>node)
				case ts.SyntaxKind.ObjectLiteralExpression:
					return this.parseObjectLiteralExpression(<ObjectLiteralExpression>node)
				case ts.SyntaxKind.PropertyAccessExpression:
					return this.parsePropertyAccessExpression(<PropertyAccessExpression>node)
				case ts.SyntaxKind.ArrowFunction:
					return this.parseArrowFunction(<ArrowFunction>node)
				case ts.SyntaxKind.TypeAssertionExpression:
					const typeAssertion = <TypeAssertion>node;
					return this.parse(typeAssertion.getExpression());
				case ts.SyntaxKind.AsExpression:
					const asExpression = <AsExpression>node;
					return this.parse(asExpression.getExpression());
				case ts.SyntaxKind.TypeAliasDeclaration:
					break;
				case ts.SyntaxKind.ModuleDeclaration:
				case ts.SyntaxKind.NamespaceExportDeclaration:
					return this.parseNamespaceExportDeclaration(<NamespaceDeclaration>node)
				case ts.SyntaxKind.ClassDeclaration:
					break;
				case ts.SyntaxKind.MissingDeclaration:
					break;
				case ts.SyntaxKind.InterfaceDeclaration:
					break;
				case ts.SyntaxKind.SingleLineCommentTrivia:
					break;
				case ts.SyntaxKind.NullKeyword:
					return this.parseNullKeyword()
				case ts.SyntaxKind.ImportDeclaration:
					return this.parseImportDeclaration(<ImportDeclaration>node)
				default:
					throw new Error(
						`Unsupported ast item: ${node.getKindName()}  - ${node.getText()}`
					);
			}
		})()
		return ret as T
	}

	parseFile(sourceFile: SourceFile) {
		return new IR.SourceFile(this.symbols, sourceFile.getStatements().map(x => this.parse<IR.Node>(x)))
	}
}
