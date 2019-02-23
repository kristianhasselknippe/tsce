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
	SourceFile,
	LanguageService,
    InterfaceDeclaration,
	ParameterDeclaration,
    ConditionalExpression,
    WhileStatement} from 'ts-morph';
import { SymbolTable } from "./symbolTable";
import * as IR from './ir'
import { CompilerDirective, extractCompilerDirectivesFromStrings, CompilerDirectiveKind } from './elispTypes/compilerDirective';
import { Pass } from './pipeline';
import chalk from 'chalk'

export function getDeclarationOfNode(node: Node) {
	const nodeSymbol = node.getType().getSymbol();
	if (nodeSymbol) {
		return nodeSymbol.getDeclarations();
	}
}

export function getCommentsForNode(node: Node) {
	const ret = [];
	const sourceFile = node.getSourceFile()
	const comments = node.getLeadingCommentRanges()
	if (comments) {
		for (const comment of comments) {
			const commentText = sourceFile
				.getText()
				.substring(comment.getPos(), comment.getEnd());
			ret.push(commentText);
		}
	}
	return ret;
}

function getCommentsForDeclarationOfNode(node: Node) {
	let ret: string[] = [];
	const declarations = getDeclarationOfNode(node);
	if (declarations) {
		for (const decl of declarations) {
			const comments = getCommentsForNode(decl);
			ret = ret.concat(comments);
		}
	}
	return ret;
}

export function getArgumentsOfFunctionDeclaration(funDecl: FunctionDeclaration) {
	const ret = [];
	for (const param of funDecl.getParameters()) {
		const declaration = getDeclarationOfNode(param);
		if (declaration) {
			for (const decl of declaration) {
				ret.push(decl);
			}
		}
	}
	return ret;
}

function getCompilerDirectivesForNode(node: Node) {
	const nodeComments = getCommentsForNode(node);
	const compilerDirectives = extractCompilerDirectivesFromStrings(
		nodeComments
	);
	return compilerDirectives;
}

function nodeHasCompilerDirectiveKind(
	node: Node,
	compilerDirectiveKind: CompilerDirectiveKind
) {
	const directives = getCompilerDirectivesForNode(node);
	for (const dir of directives) {
		if (dir.kind === compilerDirectiveKind) {
			return true;
		}
	}
	return false;
}

function compilerDirectivesOfDeclarationOfNode(node: Node, langService: LanguageService) {
	const definitions = langService.getDefinitionsAtPosition(
		node.getSourceFile(),
		node.getPos()
	);
	let ret: CompilerDirective[] = [];
	if (definitions) {
		for (const def of definitions) {
			let node = def.getNode();
			if (TypeGuards.isIdentifier(node)) {
				node = node.getParent()!;
			}
			const directives = getCompilerDirectivesForNode(node);
			ret = ret.concat(directives);
		}
	}
	return ret;
}

export function declarationOfNodeHasCompilerDirectiveKind(
	node: Node,
	compilerDirectiveKind: CompilerDirectiveKind
) {
	const functionDeclarations = getDeclarationOfNode(node);
	if (functionDeclarations) {
		for (const decl of functionDeclarations) {
			if (
				nodeHasCompilerDirectiveKind(
					decl,
					compilerDirectiveKind
				)
			) {
				return true;
			}
		}
	}
	return false;
}

export interface TableItem<TNode, TData> {
	node: TNode
	data?: TData
}

class ParserBase<TNode, TData> {
	private symTable: SymbolTable<TableItem<TNode, TData>> = new SymbolTable()

	get symbols() {
		return this.symTable
	}

	insertSymbol(name: string, node: TNode, data?: TData): TNode {
		this.symTable.insert(name, {
			node,
			data
		})
		return node
	}

	enterScope(name: string, body: () => TNode, data?: TData) {
		this.symTable = this.symTable.enterScope()
		const item = body()
		this.symTable = this.symTable.parent
		this.insertSymbol(name, item, data)
		return item
	}

	enterAnonymousScope(body: () => TNode) {
		this.symTable = this.symTable.enterScope()
		const item = body()
		this.symTable = this.symTable.parent
		return item
	}
}

export enum SymbolType {
	FunctionDeclaration,
	VariableDeclaration,
	ImportedName,
	FunctionArgument,
	EnumDeclaration
}

export interface NodeData {
	compilerDirectives: CompilerDirective[]
	symbolType: SymbolType
	hasImplementation: boolean
	fileName: string
	/** Whether this symbol was declared in the root scope. Used for adding namespace prefixes to identifier in elisp */
	isRootLevelDeclaration: boolean
}

export class Parser extends ParserBase<IR.Node, NodeData> implements Pass<SourceFile, IR.SourceFile> {
	constructor(readonly languageService: LanguageService) {
		super()
	}

	private parseExpressionStatement(es: ExpressionStatement) {
		return this.parse<IR.Expression>(es.getExpression());
	}

	private parseCallExpression(ce: CallExpression) {
		const leftHand = this.parse<IR.Expression>(ce.getExpression());
		const args = ce.getArguments().map(a => {
			return this.parse<IR.Expression>(a);
		});
		return new IR.CallExpression(this.symbols, ce, leftHand, args)
	}

	private parseVariableDeclaration(vd: VariableDeclaration) {
		const fileName = vd.getSourceFile().getFilePath()
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
		), {
			compilerDirectives: getCompilerDirectivesForNode(vd),
			symbolType: SymbolType.VariableDeclaration,
			hasImplementation: true,
			fileName: fileName,
			isRootLevelDeclaration: !this.symbols.hasParent
		})
	}

	private parseVariableDeclarationList(vdl: VariableDeclarationList) {
		const bindings = vdl.getDeclarations().map(x => this.parse<IR.VariableDeclaration>(x))
		return new IR.VariableDeclarationList(this.symbols, bindings);
	}

	private parseArgumentList(args: ParameterDeclaration[]) {
		return args.map(p => {
			return {
				name: p.getNameNode(),
				initializer: p.getInitializer()
			}
		}).map(x => {
			let name = this.parse<IR.Identifier>(x.name)!

			let initializer
			if (x.initializer) {
				initializer = this.parse<IR.Expression>(x.initializer)
			}
			return new IR.ArgumentDeclaration(this.symbols, name, initializer)
		})
	}

	private parseFunctionDeclaration(fd: FunctionDeclaration) {
		const fileName = fd.getSourceFile().getFilePath()
		const functionIdentifier = this.parse<IR.Identifier>(
			fd.getNameNode()!
		);

		const docStrings = fd.getJsDocs()
			.map(x => x.getComment())
			.filter(x => typeof x !== 'undefined') as string[]

		const compilerDirectives = getCompilerDirectivesForNode(fd)

		return this.enterScope(functionIdentifier.name, () => {
			let args = this.parseArgumentList(fd.getParameters())

			for (const a of args) {
				this.insertSymbol(a.name.name, a, {
					compilerDirectives: [],
					symbolType: SymbolType.FunctionArgument,
					hasImplementation: true,
					fileName,
					isRootLevelDeclaration: false
				})
			}

			let statements = fd.getStatements().map(x => {
				return this.parse<IR.Node>(x);
			})

			return new IR.FunctionDeclaration(
				this.symbols,
				functionIdentifier,
				args,
				statements,
				docStrings
			)
		}, {
			compilerDirectives,
			symbolType: SymbolType.FunctionDeclaration,
			hasImplementation: !(fd.hasDeclareKeyword()),
			fileName,
			isRootLevelDeclaration: !this.symbols.hasParent
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
		return this.insertSymbol(name.name, new IR.EnumDeclaration(
			this.symbols,
			name,
			props
		), {
			compilerDirectives: getCompilerDirectivesForNode(enumDecl),
			fileName: enumDecl.getSourceFile().getFilePath(),
			hasImplementation: !enumDecl.hasDeclareKeyword(),
			symbolType: SymbolType.EnumDeclaration,
			isRootLevelDeclaration: true,
		})
	}

	private parseIdentifier(identifierNode: Identifier) {
		const directives = compilerDirectivesOfDeclarationOfNode(identifierNode, this.languageService)
		return new IR.Identifier(this.symbols, identifierNode.getText(), directives)
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
		const leftExpr = indexer.getExpression()!
		const leftExprType = leftExpr.getType().getApparentType().getText()

		let elementAccessSource = IR.ElementType.Array
		if (leftExprType === "String") {
			elementAccessSource = IR.ElementType.String
		}

		const index = this.parse<IR.Node>(indexer.getArgumentExpression()!);
		const indexExpr = indexer.getArgumentExpression()!
		const indexExprType = indexExpr.getType().getApparentType().getText()
		let elementIndexerType = IR.ElementIndexerType.String
		switch (indexExprType) {
			case 'String':
				elementIndexerType = IR.ElementIndexerType.String
				break
			case 'Number':
				elementIndexerType = IR.ElementIndexerType.Number
				break
			default:
				throw new Error('Tried to index into an item using something other than string or number: ' + indexExprType)
		}
		return new IR.ElementAccess(this.symbols, left, index, elementAccessSource, elementIndexerType)
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
		//TODO: Make this robust
		const isRelative = (moduleName.value.indexOf(".") !== -1) || (moduleName.value.indexOf("./") !== -1)

		if (importDecl.getImportClause()) {
			const namedBindings = importDecl.getImportClause()!.getNamedBindings();
			if (namedBindings) {
				if (TypeGuards.isNamespaceImport(namedBindings)) {
					const namespaceImport = <NamespaceImport>(namedBindings);
					const namespaceIdentifier = this.parse<IR.Identifier>(namespaceImport.getNameNode());
					this.insertSymbol(namespaceIdentifier.name, namespaceIdentifier, {
						compilerDirectives: [],
						symbolType: SymbolType.ImportedName,
						hasImplementation: true,
						fileName: moduleName.value,
						isRootLevelDeclaration: isRelative
					})
					return new IR.NamespaceImport(this.symbols, moduleName, namespaceIdentifier)
				} else if (TypeGuards.isNamedImports(namedBindings)) {
					//TODO: Also handle the default import item
					const elements = namedBindings.getElements().map(x => {
						const identifier = this.parse<IR.Identifier>(x.getNameNode())
						console.log(chalk.red("fileName of the import: " + moduleName.value) + " for id: " + identifier.name)
						this.insertSymbol(identifier.name, identifier, {
							compilerDirectives: [],
							symbolType: SymbolType.ImportedName,
							hasImplementation: true,
							fileName: moduleName.value,
							isRootLevelDeclaration: isRelative
						})
						return identifier
					})
					return new IR.NamedImport(this.symbols, moduleName, elements)
				} else {
					throw new Error("Unknown import type: " + namedBinding)
				}
			}
		}
	}

	private parseArrowFunction(arrowFunc: ArrowFunction) {
		const fileName = arrowFunc.getSourceFile().getFilePath()
		return this.enterAnonymousScope(() => {
			let params = this.parseArgumentList(arrowFunc.getParameters())
			for (const param of params) {
				this.insertSymbol(param.name.name, param, {
					compilerDirectives: [],
					symbolType: SymbolType.FunctionArgument,
					hasImplementation: true,
					fileName,
					isRootLevelDeclaration: false
				})
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

	private parseConditionalExpression(ce: ConditionalExpression) {
		const condition = this.parse<IR.Expression>(ce.getCondition())
		const whenTrue = this.parse<IR.Expression>(ce.getWhenTrue())
		const whenFalse = this.parse<IR.Expression>(ce.getWhenFalse())
		return new IR.ConditionalExpression(this.symbols, condition, whenTrue, whenFalse)
	}

	private parseWhileStatement(whileStmt: WhileStatement) {
		const condition = this.parse<IR.Expression>(whileStmt.getExpression())
		const body = this.parse<IR.Block>(whileStmt.getStatement())
		return new IR.While(this.symbols, condition, body)
	}

	private parse<T extends (IR.Node | undefined)>(node?: Node): T {
		if (typeof node === "undefined") {
			return undefined as T
		}
		const ret = (() => {
			//context.printAtStackOffset(node.getKindName(), node);
			switch (node.getKind()) {
				case ts.SyntaxKind.WhileStatement:
					return this.parseWhileStatement(<WhileStatement>node)
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
				case ts.SyntaxKind.ConditionalExpression:
					return this.parseConditionalExpression(<ConditionalExpression>node)
				default:
					throw new Error(
						`Unsupported ast item: ${node.getKindName()}  - ${node.getText()}`
					);
			}
		})()
		return ret as T
	}

	perform(ast: SourceFile): IR.SourceFile {
		return new IR.SourceFile(ast.getFilePath(), this.symbols, ast.getStatements().map(x => this.parse<IR.Node>(x)))
	}

	describe() {
		return "TypeScript AST -> Intermediate Representation"
	}
}
