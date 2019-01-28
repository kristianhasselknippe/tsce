import {
	ts,
	Project,
	Node,
	ArrowFunction,
	ForStatement,
	SpreadAssignment,
	PropertyAssignment,
	ForOfStatement,
	Block,
	IfStatement,
	Identifier,
	FunctionDeclaration,
	InterfaceDeclaration,
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
	NamespaceDeclaration
} from 'ts-simple-ast';
import chalk from 'chalk'
import * as Elisp from './elispTypes';
import { Context, Marker } from './context';
import {
	extractCompilerDirectivesFromStrings,
	CompilerDirective,
	CompilerDirectiveKind
} from './elispTypes/compilerDirective';
import { TsceProject } from './projectFormat';
import { VariableDeclarationType } from './elispTypes';
import { parse } from 'path';

class CompilerProcess {
	context: Context;

	constructor(readonly project: Project) {
		this.context = new Context();
	}

	getDeclarationOfNode(node: Node) {
		const nodeSymbol = node.getType().getSymbol();
		if (nodeSymbol) {
			return nodeSymbol.getDeclarations();
		}
	}

	getCommentsForDeclarationOfNode(node: Node) {
		let ret: string[] = [];
		const declarations = this.getDeclarationOfNode(node);
		if (declarations) {
			for (const decl of declarations) {
				const comments = this.context.getCommentsForNode(decl);
				ret = ret.concat(comments);
			}
		}
		return ret;
	}

	getArgumentsOfFunctionDeclaration(funDecl: FunctionDeclaration) {
		const ret = [];
		for (const param of funDecl.getParameters()) {
			const declaration = this.getDeclarationOfNode(param);
			if (declaration) {
				for (const decl of declaration) {
					ret.push(decl);
				}
			}
		}
		return ret;
	}

	getCompilerDirectivesForNode(node: Node) {
		const nodeComments = this.context.getCommentsForNode(node);
		const compilerDirectives = extractCompilerDirectivesFromStrings(
			nodeComments
		);
		return compilerDirectives;
	}

	nodeHasCompilerDirectiveKind(
		node: Node,
		compilerDirectiveKind: CompilerDirectiveKind
	) {
		const directives = this.getCompilerDirectivesForNode(node);
		for (const dir of directives) {
			if (dir.kind === compilerDirectiveKind) {
				return true;
			}
		}
		return false;
	}

	compilerDirectivesOfDeclarationOfNode(node: Node) {
		const langService = this.project.getLanguageService();
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
				const directives = this.getCompilerDirectivesForNode(node);
				ret = ret.concat(directives);
			}
		}
		return ret;
	}

	declarationOfNodeHasCompilerDirectiveKind(
		node: Node,
		compilerDirectiveKind: CompilerDirectiveKind
	) {
		const functionDeclarations = this.getDeclarationOfNode(node);
		if (functionDeclarations) {
			for (const decl of functionDeclarations) {
				if (
					this.nodeHasCompilerDirectiveKind(
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

	getMembersOfInterfaceDeclaration(node: InterfaceDeclaration) {
		const ret = [];
		for (const property of node.getProperties()) {
			const name = property.getNameNode();
			ret.push(this.parse<Elisp.Identifier>(name));
		}
		for (const property of node.getMethods()) {
			const name = property.getNameNode();
			ret.push(this.parse<Elisp.Identifier>(name));
		}
		return ret;
	}

	getNamedArgumentNamesForCallExpression(node: CallExpression) {
		const declarations = this.getDeclarationOfNode(node.getExpression());
		if (declarations) {
			for (const declaration of declarations) {
				if (
					declaration.getKind() === ts.SyntaxKind.FunctionDeclaration
				) {
					const args = this.getArgumentsOfFunctionDeclaration(<
						FunctionDeclaration
					>declaration);
					if (args.length !== 1) {
						throw new Error(
							'Named argument functions expect 1 and only 1 argument. Got ' +
								args.length
						);
					}
					const arg = args[0];
					if (arg.getKind() === ts.SyntaxKind.InterfaceDeclaration) {
						return this.getMembersOfInterfaceDeclaration(<
							InterfaceDeclaration
						>arg);
					} else {
						throw new Error(
							'Named argument function expects their argument to be declared as an interface'
						);
					}
				}
			}
		}
		return [];
	}

	parseExpressionStatement(es: ExpressionStatement) {
		this.parse(es.getExpression());
	}

	parseCallExpression(ce: CallExpression) {
		const leftHand = this.parse<Elisp.Expression>(
			ce.getExpression()
		);
		let args = ce.getArguments().map(a => {
			return this.parse<Elisp.Expression>(a);
		});

		const isNamedArgumentsFunction = this.declarationOfNodeHasCompilerDirectiveKind(
			ce.getExpression(),
			'NamedArguments'
		);
		if (isNamedArgumentsFunction) {
			if (args.length !== 1) {
				throw new Error(
					'Named functions expects 1 and only 1 argument'
				);
			}
			let namedArgsFuncall;
			if (leftHand.isIdentifier()) {
				namedArgsFuncall = new Elisp.NamedArgumentsFunctionCallDefun(
					leftHand,
					args[0],
					this.getNamedArgumentNamesForCallExpression(ce)
				);
			} else {
				namedArgsFuncall = new Elisp.NamedArgumentsFunctionCallVariable(
					leftHand,
					args[0],
					this.getNamedArgumentNamesForCallExpression(ce)
				);
			}
			return namedArgsFuncall;
		} else {
			let funcall;
			if (leftHand.isIdentifier()) {
				const declaration = this.context.getDeclarationOfIdentifier(
					leftHand.identifierName
				);
				//TODO: Clean up this function, it is getting too big at this point
				//TODO: Also, we the way we decide if its call defun or call variable needs to change
				// at least the naming of things. It has just been forced to work at this point.
				if (
					leftHand.isFunctionIdentifier() ||
					(declaration &&
						(declaration.isFunctionDeclaration() ||
							declaration.isVariableDeclaration()))
				) {
					funcall = new Elisp.FunctionCallDefun(leftHand, args);
				} else {
					funcall = new Elisp.FunctionCallVariable(leftHand, args);
				}
			} else {
				funcall = new Elisp.FunctionCallVariable(leftHand, args);
			}
			return funcall;
		}
	}

	parseVariableDeclaration(vd: VariableDeclaration) {
		const identifier = this.parse<Elisp.Identifier>(
			vd.getNameNode()
		);
		let initializer;
		if (vd.getInitializer()) {
			initializer = this.parse<Elisp.Expression>(
				vd.getInitializer()!
			);
		}
		return new Elisp.LetItem(
			identifier,
			initializer,
			this.context.isInRootScope()
		)
	}

	parseVariableDeclarationList(vdl: VariableDeclarationList) {
		const bindings = vdl.getDeclarations().map(x => this.parse<Elisp.LetItem>(x))
		return new Elisp.LetBinding(bindings);
	}

	parseFunctionDeclaration(fd: FunctionDeclaration) {
		const compilerDirectives = this.getCompilerDirectivesForNode(fd);

		if (!fd.hasBody()) {
			return;
		}

		let args = fd
			.getParameters()
			.map(p => p.getNameNode())
			.filter(x => typeof x !== 'undefined')
			.map(x => this.parse<Elisp.Identifier>(x!))
			.map(x => new Elisp.FunctionArg(x));

		const functionIdentifier = this.parse<Elisp.Identifier>(
			fd.getNameNode()!
		);

		this.context.enterReturnableBlock()

		let statements = fd.getStatements().map(x => {
			return this.parse(x);
		}) as Elisp.Node[]

		return new Elisp.Defun(functionIdentifier, args, statements, compilerDirectives)
	}

	parseVariableStatement(vs: VariableStatement) {
		this.parse(vs.getDeclarationList());
	}

	parseEnumDeclaration(enumDecl: EnumDeclaration) {
		const name = this.parse<Elisp.Identifier>(
			enumDecl.getNameNode()
		);
		const props = [];
		for (const member of enumDecl.getMembers()) {
			const propName = this.parse<
				Elisp.Identifier | Elisp.StringLiteral
			>(member.getNameNode());
			let initializer;
			if (member.hasInitializer()) {
				initializer = this.parse<Elisp.Expression>(
					member.getInitializer()!
				);
			}
			props.push(new Elisp.EnumMember(propName, initializer));
		}
		const elispEnum = new Elisp.Enum(
			name,
			props,
			this.context.isInRootScope()
		);
		return elispEnum;
	}

	parseIdentifier(identifierNode: Identifier) {
		const symbolName = identifierNode.getText();

		const comments = this.getCommentsForDeclarationOfNode(identifierNode);

		const compilerDirectives = extractCompilerDirectivesFromStrings(
			comments
		);

		const identifierDeclaredType = this.context.getDeclarationOfIdentifier(
			symbolName
		);

		if (identifierDeclaredType) {
			if (
				identifierDeclaredType.isFunctionDeclaration() ||
				identifierDeclaredType.isVariableDeclaration()
			) {
				return new Elisp.FunctionIdentifier(symbolName, compilerDirectives)
			} else {
				return new Elisp.VariableIdentifier(symbolName, compilerDirectives)
			}
		} else {
			return new Elisp.FunctionIdentifier(symbolName, compilerDirectives)
		}
	}

	parseParenthesizedExpression(pe: ParenthesizedExpression) {
		return this.parse(pe.getExpression());
	}

	parseBinaryExpression(be: BinaryExpression) {
		const left = this.parse<Elisp.Expression>(be.getLeft());
		const right = this.parse<Elisp.Expression>(be.getRight());

		let op = be.getOperatorToken();
		if (op.getText() === '=') {
			//TODO Not use string literal
			return new Elisp.Assignment(left, right)
		} else {
			return new Elisp.BinaryExpression(op.getText(), left, right)
		}
	}

	parsePostfixUnaryExpression(pue: PostfixUnaryExpression) {
		const operator = pue.getOperatorToken();
		const operand = this.parse<Elisp.Expression>(pue.getOperand());
		return new Elisp.UnaryPostfixExpression(operator, operand)
	}

	parsePrefixUnaryExpression(pue: PrefixUnaryExpression) {
		let operator = ts.tokenToString(pue.getOperatorToken());
		const operand = this.parse<Elisp.Expression>(pue.getOperand());
		return new Elisp.UnaryPrefixExpression(operator!, operand);
	}

	parseDeleteExpression(delExpr: DeleteExpression) {
		const expr = this.parse<Elisp.Expression>(
			delExpr.getExpression()
		);
		return new Elisp.DeleteExpression(expr);
	}

	parseFalseKeyword() {
		return new Elisp.BooleanLiteral(false);
	}

	parseTrueKeyword() {
		return new Elisp.BooleanLiteral(true)
	}

	parseIfStatement(ifExp: IfStatement) {
		const predicate = this.parse<Elisp.Expression>(
			ifExp.getExpression()
		);

		let ifBody = new Elisp.Body([]);

		const thenStatement = <Block>ifExp.getThenStatement();
		if (thenStatement.getStatements().length > 0) {
			ifBody = new Elisp.Body(thenStatement.getStatements().map(x => this.parse(x)))
		}
		let elseBody = new Elisp.Body([]);
		if (ifExp.getElseStatement()) {
			if (
				ifExp.getElseStatement()!.getKind() ===
				ts.SyntaxKind.IfStatement
			) {
				elseBody = new Elisp.Body([this.parse(ifExp.getElseStatement()!)]);
			} else {
				const elseStatement = ifExp.getElseStatement();
				if (elseStatement) {
					elseBody = new Elisp.Body([this.parse(elseStatement)]);
				}
			}
		}

		return new Elisp.IfExpression(predicate, ifBody, elseBody);
	}

	parseReturnStatement(retStatement: ReturnStatement) {
		let returnValue;
		if (retStatement.getExpression()) {
			returnValue = this.parse<Elisp.Expression>(
				retStatement.getExpression()!
			);
		}
		return new Elisp.ReturnStatement(
			this.context.getCurrentBlockId(),
			returnValue
		)
	}

	parseForOfStatement(forOf: ForOfStatement) {
		const forOfInitializer = forOf.getInitializer();
		const forOfExpression = forOf.getExpression();

		const variableInitializer = this.parse<
			Elisp.LetBinding
			>(forOfInitializer);
		const loopExpression = this.parse<
			Elisp.Expression
			>(forOfExpression);

		const body = this.parse(forOf.getStatement())
		return new Elisp.ForOf(variableInitializer, loopExpression, body)
	}

	parseForStatement(forStatement: ForStatement) {
		const initializer = forStatement.getInitializer();

		let init;
		if (initializer) {
			init = this.parse<Elisp.LetBinding>(
				initializer
			);
		}

		const condition = forStatement.getCondition();
		let cond;
		if (condition) {
			cond = this.parse<Elisp.Expression>(
				condition
			);
		}

		const incrementor = forStatement.getIncrementor();
		let inc;
		if (incrementor) {
			inc = this.parse<Elisp.Expression>(
				incrementor
			);
		}

		const body = this.parse(forStatement.getStatement())
		return new Elisp.ForStatement(body, init, cond, inc)
	}

	parseElementAccess(indexer: ElementAccessExpression) {
		const leftHand = this.parse<Elisp.Expression>(
			indexer.getExpression()
		);
		const index = this.parse<Elisp.Expression>(
			indexer.getArgumentExpression()!
		);

		const leftHandType = indexer.getExpression().getType();
		const indexType = indexer
			.getArgumentExpression()!
			.getType();

		if (
			leftHandType.isString() ||
				leftHandType.isStringLiteral()
		) {
			return new Elisp.StringIndexer(leftHand, index)
		} else if (
			indexType.isNumber() ||
				indexType.isNumberLiteral()
		) {
			return new Elisp.ArrayIndexer(leftHand, index)
		} else {
			return new Elisp.ElementIndexer(leftHand, index)
		}
	}

	parseArrayLiteralExpression(arrayLiteral: ArrayLiteralExpression) {
		const items = [];
		for (const item of arrayLiteral.getElements()) {
			items.push(
				this.parse<Elisp.Expression>(item)
			);
		}

		return new Elisp.ArrayLiteral(items);
	}

	parseObjectLiteralExpression(objectLiteral: ObjectLiteralExpression) {
		const properties = [];
		for (const property of objectLiteral.getProperties()) {
			switch (property.getKind()) {
				case ts.SyntaxKind.PropertyAssignment:
					{
						const assignment = <PropertyAssignment>(
							property
						);

						const identifier = this.parse<
							Elisp.PropertyName
							>(assignment.getNameNode());
						const initializer = this.parse<
							Elisp.Expression
							>(assignment.getInitializer()!);

						properties.push(
							new Elisp.Property(
								identifier,
								initializer
							)
						);
					}
					break;
				case ts.SyntaxKind.ShorthandPropertyAssignment:
					{
						const shorthand = <
							ShorthandPropertyAssignment
							>property;
						const identifier = this.parse<Elisp.Identifier>(
							shorthand.getNameNode()
						);
						properties.push(
							new Elisp.Property(
								identifier,
								identifier
							)
						);
					}
					break;
				case ts.SyntaxKind.SpreadAssignment: {
					const spread = <SpreadAssignment>property;
					throw new Error(
						'Spread operator not currently supported'
					);
				}
			}
		}
		return new Elisp.ObjectLiteral(properties);
	}

	parsePropertyAccessExpression(propAccess: PropertyAccessExpression) {
		const leftHand = this.parse<Elisp.Expression>(
			propAccess.getExpression()
		);
		const rightHand = this.parse<Elisp.Identifier>(
			propAccess.getNameNode()
		);
		if (leftHand.isIdentifier()) {
			const leftHandDecl = this.context.getDeclarationOfIdentifier(
				leftHand.identifierName
			);
			if (
				leftHandDecl &&
					leftHandDecl.isVariableDeclaration()
			) {
				const compilerDirectives = this.compilerDirectivesOfDeclarationOfNode(
					propAccess.getNameNode()
				);
				return new Elisp.FunctionIdentifier(
					rightHand.identifierName,
					compilerDirectives
				)
			}
		}
		return new Elisp.PropertyAccess(leftHand, rightHand)
	}

	parseImportDeclaration(importDecl: ImportDeclaration) {
		const moduleName = this.parse<
			Elisp.StringLiteral
			>(importDecl.getModuleSpecifier());

		let isRelativePath = importDecl.isModuleSpecifierRelative();
		//TODO: Make this more robust! We check here if we are looking at a path or an ambient(?) module import

		const importClause = importDecl.getImportClause();
		if (importClause) {
			const namedBindings = importDecl
				.getImportClause()!
				.getNamedBindings();
			if (namedBindings) {
				if (
					TypeGuards.isNamespaceImport(namedBindings)
				) {
					//Need to create an elisp object with the entire namespace
					const namespaceImport = <NamespaceImport>(
						namedBindings
					);
					const namespaceIdentifier = this.parse<
						Elisp.Identifier
						>(namespaceImport.getNameNode());
					return new Elisp.NamespaceImport(
						new Elisp.VariableDeclaration(
							namespaceIdentifier
						),
						moduleName,
						isRelativePath
					)
				} else if (
					TypeGuards.isNamedImports(namedBindings)
				) {
					const elements = [];
					for (const element of namedBindings.getElements()) {
						const elementType = element.getType();
						const callSignatures = elementType.getCallSignatures();
						let variableType =
							VariableDeclarationType.Variable;
						if (callSignatures.length > 0) {
							variableType =
								VariableDeclarationType.Function;
						}
						const nameNode = element.getNameNode();
						const identifier = this.parse<
							Elisp.Identifier
							>(nameNode);
						elements.push(
							new Elisp.VariableDeclaration(
								identifier,
								variableType
							)
						);
					}
					return new Elisp.ModuleImport(
						moduleName,
						elements,
						isRelativePath
					)
				}
			}
		}
	}

	parseArrowFunction(arrowFunc: ArrowFunction) {
		let params = arrowFunc
			.getParameters()
			.map(p => p.getNameNode())
			.filter(x => typeof x !== 'undefined')
			.map(x => this.parse<Elisp.Identifier>(x!))
			.map(x => new Elisp.FunctionArg(x));

		const body = this.parse(arrowFunc.getBody())
		return new Elisp.Lambda(params, body);
	}

	parseNamespaceExportDeclaration(mod: NamespaceDeclaration) {
		let name = mod.getName();
		if (name.indexOf('"') > -1 || name.indexOf("'") > -1) {
			name = name.substring(1, name.length - 1);
		}
		return new Elisp.ModuleDeclaration(name);
	}

	parseNullKeyword() {
		return new Elisp.Null();
	}

	parse<T extends Elisp.Node>(node: Node): T {
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
					return new Elisp.NumberLiteral(node.getText())
				case ts.SyntaxKind.StringLiteral:
					const stringLiteral = <StringLiteral>node;
					return new Elisp.StringLiteral(stringLiteral.getLiteralValue())
				case ts.SyntaxKind.IfStatement:
					return this.parseIfStatement(<IfStatement>node);
				case ts.SyntaxKind.ReturnStatement:
					return this.parseReturnStatement(<ReturnStatement>node)
				case ts.SyntaxKind.Block:
					const block = <Block>node;
					return new Elisp.Body(block.getStatements().map(x => this.parse(x)))
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

	addCommonLibs() {
		//TODO Make sure it is ok to send in empty array here
		return new Elisp.ModuleImport(
			new Elisp.StringLiteral('./ts-lib'),
			[],
			true
		)
	}

	compile(): CompilationResult[] {
		const ret = [];
		for (const sourceFile of this.project.getSourceFiles()) {
			console.log(chalk.blueBright('    - Compiling file: ') + sourceFile.getFilePath())
			const body = [this.addCommonLibs()]
				.concat(sourceFile.getStatements().map(x => this.parse(x)))
			const root = new Elisp.RootScope(sourceFile, body);

			const elispSource = root.emit(0)
			ret.push({
				fileName: sourceFile.getBaseNameWithoutExtension(),
				source: elispSource
			});
		}
		return ret;
	}
}

export interface CompilationResult {
	fileName: string;
	source: string;
}

export function compileProject(program: TsceProject): CompilationResult[] {
	const compilerProcess = new CompilerProcess(program.project);
	return compilerProcess.compile();
}
