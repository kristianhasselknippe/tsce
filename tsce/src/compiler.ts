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
import * as Elisp from './elispTypes';
import { Context, Marker } from './context';
import {
	extractCompilerDirectivesFromStrings,
	CompilerDirective,
	CompilerDirectiveKind
} from './elispTypes/compilerDirective';
import { TsceProject } from './projectFormat';
import { VariableDeclarationType } from './elispTypes';

class CompilerProcess {
	context: Context;

	constructor(readonly project: Project) {
		this.context = new Context();
	}

	parseAndExpect<T extends Elisp.Node>(node: Node) {
		const prevStackLen = this.context.size;
		this.toElispNode(node);

		const stackDiff = this.context.size - prevStackLen;
		if (stackDiff !== 1) {
			throw new Error(
				'Expected stack to have one more item, but had ' + stackDiff
			);
		}

		return this.context.pop() as T;
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
		let hasTheDirective = false;
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
			ret.push(this.parseAndExpect<Elisp.Identifier>(name));
		}
		for (const property of node.getMethods()) {
			const name = property.getNameNode();
			ret.push(this.parseAndExpect<Elisp.Identifier>(name));
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
		this.toElispNode(es.getExpression());
	}

	parseCallExpression(ce: CallExpression) {
		const leftHand = this.parseAndExpect<Elisp.Expression>(
			ce.getExpression()
		);
		let args = ce.getArguments().map(a => {
			return this.parseAndExpect<Elisp.Expression>(a);
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
			this.context.push(namedArgsFuncall);
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
			this.context.push(funcall);
		}
	}

	parseVariableDeclaration(vd: VariableDeclaration) {
		const identifier = this.parseAndExpect<Elisp.Identifier>(
			vd.getNameNode()
		);
		let initializer;
		if (vd.getInitializer()) {
			initializer = this.parseAndExpect<Elisp.Expression>(
				vd.getInitializer()!
			);
		}
		this.context.push(
			new Elisp.LetItem(
				identifier,
				initializer,
				this.context.isInRootScope()
			)
		);
	}

	parseVariableDeclarationList(vdl: VariableDeclarationList) {
		let marker: Marker;
		if (!this.context.isInRootScope()) {
			marker = this.context.pushMarker();
		}
		for (let variable of vdl.getDeclarations()) {
			this.toElispNode(variable);
		}

		if (!this.context.isInRootScope()) {
			const bindings = this.context.popToMarker<Elisp.LetItem>(marker!);
			let letBinding = new Elisp.LetBinding(bindings);
			this.context.push(letBinding);
		}
	}

	parseFunctionDeclaration(fd: FunctionDeclaration) {
		const compilerDirectives = this.getCompilerDirectivesForNode(fd);
		const inRootScope = this.context.isInRootScope();

		if (!fd.hasBody()) {
			return;
		}

		let args = fd
			.getParameters()
			.map(p => p.getNameNode())
			.filter(x => typeof x !== 'undefined')
			.map(x => this.parseAndExpect<Elisp.Identifier>(x!))
			.map(x => new Elisp.FunctionArg(x));

		const functionIdentifier = this.parseAndExpect<Elisp.Identifier>(
			fd.getNameNode()!
		);

		let marker;
		if (inRootScope) {
			marker = this.context.push(
				new Elisp.Defun(functionIdentifier, args, compilerDirectives)
			);
		} else {
			marker = this.context.push(new Elisp.Lambda(args));
		}

		fd.getStatements().forEach(x => {
			this.toElispNode(x);
		});

		this.context.resolveTo(marker);
		const functionDecl = this.context.pop() as Elisp.Defun | Elisp.Lambda;

		if (!inRootScope) {
			this.context.push(
				new Elisp.LetBinding([
					new Elisp.LetItem(functionIdentifier, functionDecl)
				])
			);
		} else {
			this.context.push(functionDecl);
			this.context.resolveToParentOf(functionDecl);
		}
	}

	parseVariableStatement(vs: VariableStatement) {
		this.toElispNode(vs.getDeclarationList());
	}

	parseEnumDeclaration(enumDecl: EnumDeclaration) {
		const name = this.parseAndExpect<Elisp.Identifier>(
			enumDecl.getNameNode()
		);
		const props = [];
		for (const member of enumDecl.getMembers()) {
			const propName = this.parseAndExpect<
				Elisp.Identifier | Elisp.StringLiteral
			>(member.getNameNode());
			let initializer;
			if (member.hasInitializer()) {
				initializer = this.parseAndExpect<Elisp.Expression>(
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
		this.context.push(elispEnum);
		this.context.resolveToParentOf(elispEnum);
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
				this.context.push(
					new Elisp.FunctionIdentifier(symbolName, compilerDirectives)
				);
			} else {
				this.context.push(
					new Elisp.VariableIdentifier(symbolName, compilerDirectives)
				);
			}
		} else {
			this.context.push(
				new Elisp.FunctionIdentifier(symbolName, compilerDirectives)
			);
		}
	}

	parseParenthesizedExpression(pe: ParenthesizedExpression) {
		this.toElispNode(pe.getExpression());
	}

	parseBinaryExpression(be: BinaryExpression) {
		const left = this.parseAndExpect<Elisp.Expression>(be.getLeft());
		const right = this.parseAndExpect<Elisp.Expression>(be.getRight());

		let op = be.getOperatorToken();
		if (op.getText() === '=') {
			//TODO Not use string literal
			this.context.push(new Elisp.Assignment(left, right));
		} else {
			this.context.push(
				new Elisp.BinaryExpression(op.getText(), left, right)
			);
		}
	}

	parsePostfixUnaryExpression(pue: PostfixUnaryExpression) {
		const operator = pue.getOperatorToken();

		const operand = this.parseAndExpect<Elisp.Expression>(pue.getOperand());

		this.context.push(new Elisp.UnaryPostfixExpression(operator, operand));
	}

	parsePrefixUnaryExpression(pue: PrefixUnaryExpression) {
		let operator = ts.tokenToString(pue.getOperatorToken());

		const operand = this.parseAndExpect<Elisp.Expression>(pue.getOperand());

		this.context.push(new Elisp.UnaryPrefixExpression(operator!, operand));
	}

	parseDeleteExpression(delExpr: DeleteExpression) {
		const expr = this.parseAndExpect<Elisp.Expression>(
			delExpr.getExpression()
		);
		this.context.push(new Elisp.DeleteExpression(expr));
	}

	parseFalseKeyword() {
		this.context.push(new Elisp.BooleanLiteral(false));
	}

	parseTrueKeyword() {
		this.context.push(new Elisp.BooleanLiteral(true));
	}

	parseIfStatement(ifExp: IfStatement) {
		const predicate = this.parseAndExpect<Elisp.Expression>(
			ifExp.getExpression()
		);

		const ifBody = this.context.push(new Elisp.Body());

		const thenStatement = <Block>ifExp.getThenStatement();
		if (thenStatement.getStatements().length === 0) {
			this.context.push(new Elisp.Null());
		} else {
			for (let expr of thenStatement.getStatements()) {
				this.toElispNode(expr);
			}
		}
		this.context.resolveTo(ifBody);
		this.context.pop();

		let elseBody;
		if (ifExp.getElseStatement()) {
			elseBody = this.context.push(new Elisp.Body());
			if (
				ifExp.getElseStatement()!.getKind() ===
				ts.SyntaxKind.IfStatement
			) {
				this.toElispNode(ifExp.getElseStatement()!);
			} else {
				const elseStatement = ifExp.getElseStatement();
				if (elseStatement) {
					this.toElispNode(elseStatement);
				}
			}
			this.context.resolveTo(elseBody);
			this.context.pop();
		}

		this.context.push(new Elisp.IfExpression(predicate, ifBody, elseBody));
	}

	parseReturnStatement(retStatement: ReturnStatement) {
		let returnValue;
		if (retStatement.getExpression()) {
			returnValue = this.parseAndExpect<Elisp.Expression>(
				retStatement.getExpression()!
			);
		}
		this.context.push(
			new Elisp.ReturnStatement(
				this.context.getCurrentBlock().blockId,
				returnValue
			)
		);
	}

	toElispNode(node: Node) {
		const context = this.context;
		context.incStackCount();

		(() => {
			context.printAtStackOffset(node.getKindName(), node);
			switch (node.getKind()) {
				case ts.SyntaxKind.ExpressionStatement:
					this.parseExpressionStatement(<ExpressionStatement>node);
					break;
				case ts.SyntaxKind.CallExpression: {
					this.parseCallExpression(<CallExpression>node);
					break;
				}
				case ts.SyntaxKind.VariableDeclaration:
					this.parseVariableDeclaration(<VariableDeclaration>node);
					break;
				case ts.SyntaxKind.VariableDeclarationList:
					this.parseVariableDeclarationList(<VariableDeclarationList>(
						node
					));
					break;
				case ts.SyntaxKind.VariableStatement: {
					this.parseVariableStatement(<VariableStatement>node);
					break;
				}
				case ts.SyntaxKind.FunctionDeclaration: {
					this.parseFunctionDeclaration(<FunctionDeclaration>node);
					break;
				}
				case ts.SyntaxKind.EnumDeclaration:
					this.parseEnumDeclaration(<EnumDeclaration>node);
					break;
				case ts.SyntaxKind.Identifier: {
					this.parseIdentifier(<Identifier>node);
					break;
				}
				case ts.SyntaxKind.ParenthesizedExpression:
					this.parseParenthesizedExpression(<ParenthesizedExpression>(
						node
					));
					break;
				case ts.SyntaxKind.BinaryExpression: {
					this.parseBinaryExpression(<BinaryExpression>node);
					break;
				}
				case ts.SyntaxKind.PostfixUnaryExpression:
					this.parsePostfixUnaryExpression(<PostfixUnaryExpression>(
						node
					));
					break;
				case ts.SyntaxKind.PrefixUnaryExpression: {
					this.parsePrefixUnaryExpression(<PrefixUnaryExpression>(
						node
					));
					break;
				}
				case ts.SyntaxKind.DeleteExpression:
					this.parseDeleteExpression(<DeleteExpression>node);
					break;
				case ts.SyntaxKind.FalseKeyword: {
					this.parseFalseKeyword();
					break;
				}
				case ts.SyntaxKind.TrueKeyword: {
					this.parseTrueKeyword();
					break;
				}
				case ts.SyntaxKind.NumericLiteral: {
					context.push(new Elisp.NumberLiteral(node.getText()));
					break;
				}
				case ts.SyntaxKind.StringLiteral: {
					const stringLiteral = <StringLiteral>node;
					context.push(
						new Elisp.StringLiteral(stringLiteral.getLiteralValue())
					);
					break;
				}
				case ts.SyntaxKind.IfStatement: {
					this.parseIfStatement(<IfStatement>node);
					break;
				}
				case ts.SyntaxKind.ReturnStatement:
					this.parseReturnStatement(<ReturnStatement>node)
					break;
				case ts.SyntaxKind.Block: {
					const block = <Block>node;
					for (const statement of block.getStatements()) {
						this.toElispNode(statement);
					}
					break;
				}
				case ts.SyntaxKind.ForOfStatement:
					const forOf = <ForOfStatement>node;
					const forOfInitializer = forOf.getInitializer();
					const forOfExpression = forOf.getExpression();

					const variableInitializer = this.parseAndExpect<
						Elisp.LetBinding
					>(forOfInitializer);
					const loopExpression = this.parseAndExpect<
						Elisp.Expression
					>(forOfExpression);

					const forOfItem = context.push(
						new Elisp.ForOf(variableInitializer, loopExpression)
					);

					this.toElispNode(forOf.getStatement());
					context.resolveToParentOf(forOfItem);
					break;
				case ts.SyntaxKind.ForInStatement:
					throw new Error(
						'For-In statements are currently not supported'
					);
				case ts.SyntaxKind.ForStatement:
					{
						const forStatement = <ForStatement>node;
						const initializer = forStatement.getInitializer();

						let init;
						if (initializer) {
							init = this.parseAndExpect<Elisp.LetBinding>(
								initializer
							);
						}

						const condition = forStatement.getCondition();
						let cond;
						if (condition) {
							cond = this.parseAndExpect<Elisp.Expression>(
								condition
							);
						}

						const incrementor = forStatement.getIncrementor();
						let inc;
						if (incrementor) {
							inc = this.parseAndExpect<Elisp.Expression>(
								incrementor
							);
						}

						const f = context.push(
							new Elisp.ForStatement(init, cond, inc)
						);

						this.toElispNode(forStatement.getStatement());
						context.resolveToParentOf(f);
					}
					break;
				case ts.SyntaxKind.ElementAccessExpression:
					{
						const indexer = <ElementAccessExpression>node;

						const leftHand = this.parseAndExpect<Elisp.Expression>(
							indexer.getExpression()
						);
						const index = this.parseAndExpect<Elisp.Expression>(
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
							context.push(
								new Elisp.StringIndexer(leftHand, index)
							);
						} else if (
							indexType.isNumber() ||
							indexType.isNumberLiteral()
						) {
							context.push(
								new Elisp.ArrayIndexer(leftHand, index)
							);
						} else {
							context.push(
								new Elisp.ElementIndexer(leftHand, index)
							);
						}
					}
					break;
				case ts.SyntaxKind.ArrayLiteralExpression:
					{
						const arrayLiteral = <ArrayLiteralExpression>node;

						const items = [];
						for (const item of arrayLiteral.getElements()) {
							items.push(
								this.parseAndExpect<Elisp.Expression>(item)
							);
						}

						context.push(new Elisp.ArrayLiteral(items));
					}
					break;
				case ts.SyntaxKind.ObjectLiteralExpression:
					{
						const objectLiteral = <ObjectLiteralExpression>node;

						const properties = [];
						for (const property of objectLiteral.getProperties()) {
							switch (property.getKind()) {
								case ts.SyntaxKind.PropertyAssignment:
									{
										const assignment = <PropertyAssignment>(
											property
										);

										const identifier = this.parseAndExpect<
											Elisp.PropertyName
										>(assignment.getNameNode());
										const initializer = this.parseAndExpect<
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
										this.toElispNode(
											shorthand.getNameNode()
										);
										const identifier = context.pop() as Elisp.Identifier;
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
							//this.toElispNode
						}
						context.push(new Elisp.ObjectLiteral(properties));
					}
					break;
				case ts.SyntaxKind.PropertyAccessExpression:
					{
						const propAccess = <PropertyAccessExpression>node;

						const leftHand = this.parseAndExpect<Elisp.Expression>(
							propAccess.getExpression()
						);
						const rightHand = this.parseAndExpect<Elisp.Identifier>(
							propAccess.getNameNode()
						);
						if (leftHand.isIdentifier()) {
							const leftHandDecl = context.getDeclarationOfIdentifier(
								leftHand.identifierName
							);
							if (
								leftHandDecl &&
								leftHandDecl.isVariableDeclaration()
							) {
								const compilerDirectives = this.compilerDirectivesOfDeclarationOfNode(
									propAccess.getNameNode()
								);
								context.push(
									new Elisp.FunctionIdentifier(
										rightHand.identifierName,
										compilerDirectives
									)
								);
								break;
							}
						}
						context.push(
							new Elisp.PropertyAccess(leftHand, rightHand)
						);
					}
					break;
				case ts.SyntaxKind.ArrowFunction:
					{
						const arrowFunc = <ArrowFunction>node;
						let params = arrowFunc
							.getParameters()
							.map(p => p.getNameNode())
							.filter(x => typeof x !== 'undefined')
							.map(x => this.parseAndExpect<Elisp.Identifier>(x!))
							.map(x => new Elisp.FunctionArg(x));

						const lambda = context.push(new Elisp.Lambda(params));
						this.toElispNode(arrowFunc.getBody());
						context.resolveTo(lambda);
					}
					break;
				case ts.SyntaxKind.TypeAssertionExpression:
					const typeAssertion = <TypeAssertion>node;
					this.toElispNode(typeAssertion.getExpression());
					break;
				case ts.SyntaxKind.AsExpression:
					const asExpression = <AsExpression>node;
					this.toElispNode(asExpression.getExpression());
					break;
				case ts.SyntaxKind.TypeAliasDeclaration:
					break;
				case ts.SyntaxKind.ModuleDeclaration:
				case ts.SyntaxKind.NamespaceExportDeclaration:
					const mod = <NamespaceDeclaration>node;
					let name = mod.getName();
					if (name.indexOf('"') > -1 || name.indexOf("'") > -1) {
						name = name.substring(1, name.length - 1);
					}
					console.log('Fooo: ' + mod.getNameNode().getText());
					context.push(new Elisp.ModuleDeclaration(name));
					break;
				case ts.SyntaxKind.ClassDeclaration:
					break;
				case ts.SyntaxKind.MissingDeclaration:
					break;
				case ts.SyntaxKind.InterfaceDeclaration:
					{
					}
					break;
				case ts.SyntaxKind.SingleLineCommentTrivia:
					{
						//const singleLineComment = <ts.SingleLineCommentTrivia>node
					}
					break;
				case ts.SyntaxKind.ConditionalExpression: {
					throw new Error(
						'Unrecognized language feature: ConditionalExpression'
					);
				}
				case ts.SyntaxKind.NullKeyword:
					{
						context.push(new Elisp.Null());
					}
					break;
				case ts.SyntaxKind.ImportDeclaration:
					{
						const importDecl = <ImportDeclaration>node;

						const moduleName = this.parseAndExpect<
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
									const namespaceIdentifier = this.parseAndExpect<
										Elisp.Identifier
									>(namespaceImport.getNameNode());
									context.push(
										new Elisp.NamespaceImport(
											new Elisp.VariableDeclaration(
												namespaceIdentifier
											),
											moduleName,
											isRelativePath
										)
									);
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
										const identifier = this.parseAndExpect<
											Elisp.Identifier
										>(nameNode);
										elements.push(
											new Elisp.VariableDeclaration(
												identifier,
												variableType
											)
										);
									}
									context.push(
										new Elisp.ModuleImport(
											moduleName,
											elements,
											isRelativePath
										)
									);
								}
							}
						}
						context.printStack();
					}
					break;
				default:
					throw new Error(
						`Unsupported ast item: ${node.getKindName()}  - ${node.getText()}`
					);
			}
		})();
		context.decStackCount();
	}

	addCommonLibs() {
		this.context.push(
			//TODO Make sure it is ok to send in empty array here
			new Elisp.ModuleImport(
				new Elisp.StringLiteral('./ts-lib'),
				[],
				true
			)
		);
	}

	compile(): CompilationResult[] {
		const ret = [];
		for (const sourceFile of this.project.getSourceFiles()) {
			const root = this.context.push(new Elisp.RootScope(sourceFile));
			this.addCommonLibs();
			for (var statement of sourceFile.getStatements()) {
				this.toElispNode(statement);
			}
			this.context.resolveTo(root);
			const elispSource = this.context.getElispSource();
			ret.push({
				fileName: sourceFile.getBaseNameWithoutExtension(),
				source: elispSource
			});
			this.context.pop();
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
