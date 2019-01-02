import * as ts from 'typescript';
import * as Elisp from './elispTypes';
import { Symbol, SymbolType, Context, Marker } from './context';
import {
	loadProjectFile,
	loadInputFiles,
	compileProject
} from './projectFormat';
import {
	createSourceFile,
	getSyntheticLeadingComments,
	getCommentRange,
	getLeadingCommentRanges,
	SymbolTable,
    createLanguageService,

    getTypeParameterOwner} from 'typescript';
import { fail } from 'assert';
import {
	extractCompilerDirectivesFromString,
	extractCompilerDirectivesFromStrings,
	CompilerDirective,
	CompilerDirectiveKind
} from './elispTypes/compilerDirective';
import { LetBinding } from './elispTypes';

function parseAndExpect<T extends Elisp.Node>(node: ts.Node, context: Context) {
	const prevStackLen = context.size;
	toElispNode(node, context);

	const stackDiff = context.size - prevStackLen;
	if (stackDiff !== 1) {
		throw new Error(
			'Expected stack to have one more item, but had ' + stackDiff
		);
	}

	return context.pop() as T;
}

function getDeclarationOfNode(node: ts.Node, context: Context) {
	const nodeType = context.typeChecker.getTypeAtLocation(node)
	const nodeSymbol = nodeType.getSymbol()
	if (nodeSymbol) {
		return nodeSymbol.getDeclarations();
	}
}

function getCommentsForDeclarationOfNode(
	node: ts.Node,
	context: Context
) {
	let ret: string[] = [];
	const declarations = getDeclarationOfNode(node, context)
	if (declarations) {
		for (const decl of declarations) {
			const comments = context.getCommentsForNode(decl);
			ret = ret.concat(comments);
		}
	}
	return ret;
}

function getArgumentsOfFunctionDeclaration(funDecl: ts.FunctionDeclaration, context: Context) {
	const ret = []
	for (const param of funDecl.parameters) {
		const declaration = getDeclarationOfNode(param, context)
		if (declaration) {
			for (const decl of declaration) {
				ret.push(decl)
			}
		}
	}
	return ret
}

function getCompilerDirectivesForNode(node: ts.Node, context: Context) {
	const nodeComments = context.getCommentsForNode(node);
	const compilerDirectives = extractCompilerDirectivesFromStrings(nodeComments)
	return compilerDirectives
}

function nodeHasCompilerDirectiveKind(node: ts.Node, compilerDirectiveKind: CompilerDirectiveKind, context: Context) {
	const directives = getCompilerDirectivesForNode(node, context)
	for (const dir of directives) {
		if (dir.kind === compilerDirectiveKind) {
			return true
		}
	}
	return false
}

function declarationOfNodeHasCompilerDirectiveKind(node: ts.Node, compilerDirectiveKind: CompilerDirectiveKind, context: Context) {
	const functionDeclarations = getDeclarationOfNode(node, context)
	let hasTheDirective = false
	if (functionDeclarations) {
		for (const decl of functionDeclarations) {
			if (nodeHasCompilerDirectiveKind(decl, compilerDirectiveKind, context)) {
				return true
			}
		}
	}
	return false
}

function getMembersOfInterfaceDeclaration(node: ts.InterfaceDeclaration, context: Context) {
	const ret = []
	for (const member of node.members) {
		const name = member.name
		if (name) {
			ret.push(name.getText())
		}
	}
	return ret
}

function getNamedArgumentNamesForCallExpression(node: ts.CallExpression, context: Context) {
	const declarations = getDeclarationOfNode(node.expression, context)
	if (declarations) {
		for (const declaration of declarations) {
			if (declaration.kind === ts.SyntaxKind.FunctionDeclaration) {
				const args = getArgumentsOfFunctionDeclaration(<ts.FunctionDeclaration>declaration, context)
				if (args.length !== 1) {
					throw new Error('Named argument functions expect 1 and only 1 argument. Got ' + args.length)
				}
				const arg = args[0]
				if (arg.kind === ts.SyntaxKind.InterfaceDeclaration) {
					return getMembersOfInterfaceDeclaration(<ts.InterfaceDeclaration>arg, context)
				} else {
					throw new Error('Named argument function expects their argument to be declared as an interface')
				}
			}
		}
	}
	return []
}

function toElispNode(node: ts.Node, context: Context) {
	context.incStackCount();

	(() => {
		const compilerDirectives = getCompilerDirectivesForNode(node, context)
		switch (node.kind) {
			case ts.SyntaxKind.ExpressionStatement:
				context.printAtStackOffset('ExpressionStatement', node);
				let es = <ts.ExpressionStatement>node;
				toElispNode(es.expression, context);
				break;

			case ts.SyntaxKind.CallExpression: {
				context.printAtStackOffset('CallExpression', node);
				let ce = <ts.CallExpression>node;
				const leftHand = parseAndExpect<Elisp.Expression>(
					ce.expression,
					context
				);
				let args = ce.arguments.map(a => {
					return parseAndExpect<Elisp.Expression>(a, context);
				});

				const isNamedArgumentsFunction = declarationOfNodeHasCompilerDirectiveKind(ce.expression, 'NamedArguments', context)
				if (isNamedArgumentsFunction) {
					if (args.length !== 1) {
						throw new Error('Named functions expects 1 and only 1 argument')
					}
					let namedArgsFuncall = new Elisp.NamedArgumentsFunctionCall(leftHand, args[0], getNamedArgumentNamesForCallExpression(ce, context));
					context.push(namedArgsFuncall);
				} else {
					let funcall = new Elisp.FunctionCall(leftHand, args);
					context.push(funcall);
				}
				break;
			}
			case ts.SyntaxKind.VariableDeclaration:
				context.printAtStackOffset('VariableDeclaration: ', node);
				const vd = <ts.VariableDeclaration>node;

				const identifier = parseAndExpect<Elisp.Identifier>(vd.name, context)
				let name = vd.name.getText();
				context.addSymbol({
					name,
					type: SymbolType.Variable
				});
				let initializer;
				if (vd.initializer) {
					initializer = parseAndExpect<Elisp.Expression>(
						vd.initializer,
						context
					);
				}
				if (context.isInRootScope()) {
					context.push(new Elisp.Set(identifier, initializer))
				} else {
					context.push(new Elisp.LetItem(identifier, initializer));
				}
				break;

			case ts.SyntaxKind.VariableDeclarationList:
				context.printAtStackOffset('VariableDeclarationList', node);
				const vdl = <ts.VariableDeclarationList>node;

				let marker: Marker
				if (!context.isInRootScope()) {
					 marker = context.pushMarker()
				}
				for (let variable of vdl.declarations) {
					toElispNode(variable, context);
				}

				if (!context.isInRootScope()) {
					const bindings = context.popToMarker<Elisp.LetItem>(marker!)
					let letBinding = new Elisp.LetBinding(bindings);
					context.push(letBinding);
				}
				break;

			case ts.SyntaxKind.VariableStatement: {
				context.printAtStackOffset('VariableStatement', node);
				let vs = <ts.VariableStatement>node;
				toElispNode(vs.declarationList, context);
				break;
			}
			case ts.SyntaxKind.FunctionDeclaration: {
				context.printAtStackOffset('FunctionDeclaration', node);
				let fd = <ts.FunctionDeclaration>node;

				const inRootScope = context.isInRootScope()
				let name = fd.name!;
				context.addSymbol({
					name: name.getText(),
					type: inRootScope ? SymbolType.Function : SymbolType.Variable
				});

				if (typeof fd.body === 'undefined') {
					break;
				}

				let args = fd.parameters
					? fd.parameters.map(p => p.name.getText())
					: [];

				args.forEach(arg => {
					context.addSymbol({
						name: arg,
						type: SymbolType.Variable
					});
				});

				const functionIdentifier = parseAndExpect<Elisp.Identifier>(
					name,
					context
				);

				let marker
				if (inRootScope) {
					marker = context.push(new Elisp.Defun(
						functionIdentifier,
						args,
						compilerDirectives
					))
				} else {
					marker = context.push(new Elisp.Lambda(args))
				}

				if (fd.body) {
					fd.body.statements.forEach(x => {
						toElispNode(x, context);
					});
				}

				context.resolveTo(marker)
				const functionDecl = context.pop() as Elisp.Defun | Elisp.Lambda

				if (!inRootScope) {
					context.push(new Elisp.LetBinding([new Elisp.LetItem(functionIdentifier, functionDecl)]))
				} else {
					context.push(functionDecl)
					context.resolveToParentOf(functionDecl)
				}
				break;
			}
			case ts.SyntaxKind.Identifier: {
				context.printAtStackOffset('Identifier', node);
				const identifierNode = <ts.Identifier>node;
				const symbolName = identifierNode.text;
				const symbol = context.getSymbolForName(symbolName);

				const comments = getCommentsForDeclarationOfNode(
					identifierNode,
					context
				);

				const compilerDirectives = extractCompilerDirectivesFromStrings(
					comments
				);

				context.push(
					new Elisp.Identifier(symbolName, symbol, compilerDirectives)
				);
				break;
			}
			case ts.SyntaxKind.ParenthesizedExpression:
				context.printAtStackOffset('ParenthesizedExpression: ', node);
				let pe = <ts.ParenthesizedExpression>node;
				toElispNode(pe.expression, context);
				break;
			case ts.SyntaxKind.BinaryExpression: {
				context.printAtStackOffset('BinaryExpression: ', node);
				let be = <ts.BinaryExpression>node;

				const left = parseAndExpect<Elisp.Expression>(be.left, context);
				const right = parseAndExpect<Elisp.Expression>(
					be.right,
					context
				);

				let op = be.operatorToken;
				if (op.getText() === '=') {
					//TODO Not use string literal
					context.push(
						new Elisp.Assignment(left as Elisp.Identifier, right)
					);
				} else {
					context.push(
						new Elisp.BinaryExpression(op.getText(), left, right)
					);
				}
				break;
			}
			case ts.SyntaxKind.PostfixUnaryExpression:
				context.printAtStackOffset('PostfixUnaryExpression', node);
				const pue = <ts.PostfixUnaryExpression>node;
				const operator = pue.operator;

				const operand = parseAndExpect<Elisp.Expression>(
					pue.operand,
					context
				);

				context.push(
					new Elisp.UnaryPostfixExpression(operator, operand)
				);
				break;
			case ts.SyntaxKind.PrefixUnaryExpression: {
				context.printAtStackOffset('PrefixUnaryExpression');
				let pue = <ts.PrefixUnaryExpression>node;
				let operator = ts.tokenToString(pue.operator);

				const operand = parseAndExpect<Elisp.Expression>(
					pue.operand,
					context
				);

				context.push(
					new Elisp.UnaryPrefixExpression(operator!, operand)
				);
				break;
			}
			case ts.SyntaxKind.FalseKeyword: {
				context.printAtStackOffset('FalseKeyword');
				context.push(new Elisp.BooleanLiteral(false));
				break;
			}
			case ts.SyntaxKind.TrueKeyword: {
				context.printAtStackOffset('TrueKeyword');
				context.push(new Elisp.BooleanLiteral(true));
				break;
			}
			case ts.SyntaxKind.NumericLiteral: {
				context.printAtStackOffset('NumericLiteral');
				context.push(
					new Elisp.NumberLiteral((<ts.NumericLiteral>node).text)
				);
				break;
			}
			case ts.SyntaxKind.StringLiteral: {
				context.printAtStackOffset('StringLiteral');
				context.push(
					new Elisp.StringLiteral((<ts.StringLiteral>node).text)
				);
				break;
			}
			case ts.SyntaxKind.IfStatement: {
				context.printAtStackOffset('IfStatement');
				let ifExp = <ts.IfStatement>node;

				const predicate = parseAndExpect<Elisp.Expression>(
					ifExp.expression,
					context
				);

				const ifBody = context.push(new Elisp.Body());

				for (let expr of (<ts.Block>ifExp.thenStatement).statements) {
					toElispNode(expr, context);
				}
				context.resolveTo(ifBody);
				context.pop();

				let elseBody;
				if (ifExp.elseStatement) {
					elseBody = context.push(new Elisp.Body());
					if (
						ifExp.elseStatement.kind === ts.SyntaxKind.IfStatement
					) {
						toElispNode(ifExp.elseStatement, context);
					} else {
						for (let expr of (<ts.Block>ifExp.thenStatement)
							.statements) {
							toElispNode(expr, context);
						}
					}
					context.resolveTo(elseBody);
					context.pop();
				}

				context.push(
					new Elisp.IfExpression(predicate, ifBody, elseBody)
				);
				break;
			}
			case ts.SyntaxKind.ReturnStatement:
				const retStatement = <ts.ReturnStatement>node;
				let returnValue;
				if (retStatement.expression) {
					returnValue = parseAndExpect<Elisp.Expression>(
						retStatement.expression,
						context
					);
				}
				context.push(
					new Elisp.ReturnStatement(
						context.getCurrentBlock().blockId,
						returnValue
					)
				);
				break;
			case ts.SyntaxKind.Block: {
				const block = <ts.Block>node;
				for (const statement of block.statements) {
					toElispNode(statement, context);
				}
				break;
			}
			case ts.SyntaxKind.ForOfStatement:
				const forOf = <ts.ForOfStatement>node;
				const forOfInitializer = forOf.initializer
				const forOfExpression = forOf.expression

				const variableInitializer = parseAndExpect<Elisp.LetBinding>(forOfInitializer, context)
				const loopExpression = parseAndExpect<Elisp.Expression>(forOfExpression, context)

				context.push(new Elisp.ForOf(variableInitializer, loopExpression))

				toElispNode(forOf.statement, context)
				break
			case ts.SyntaxKind.ForInStatement:
				throw new Error('For-In statements are currently not supported')
			case ts.SyntaxKind.ForStatement:
				{
					const forStatement = <ts.ForStatement>node;
					const initializer = forStatement.initializer;

					let init;
					if (initializer) {
						init = parseAndExpect<Elisp.LetBinding>(
							initializer,
							context
						);
					}

					const condition = forStatement.condition;
					let cond;
					if (condition) {
						cond = parseAndExpect<Elisp.Expression>(
							condition,
							context
						);
					}

					const incrementor = forStatement.incrementor;
					let inc;
					if (incrementor) {
						inc = parseAndExpect<Elisp.Expression>(
							incrementor,
							context
						);
					}

					const f = context.push(
						new Elisp.ForStatement(init, cond, inc)
					);

					toElispNode(forStatement.statement, context);
					context.resolveTo(f);
				}
				break;
			case ts.SyntaxKind.ElementAccessExpression:
				{
					const indexer = <ts.ElementAccessExpression>node;

					const leftHand = parseAndExpect<Elisp.Expression>(
						indexer.expression,
						context
					);
					const index = parseAndExpect<Elisp.Expression>(
						indexer.argumentExpression!,
						context
					);

					const leftHandType = context.typeChecker.getTypeAtLocation(indexer.expression)
					console.log("THE tiity: " + context.typeChecker.typeToString(leftHandType))
					
					if (leftHandType.flags & ts.TypeFlags.Object) {
						console.log(`    123123123 object: ${leftHandType.flags} ` + indexer.expression.getText())
						context.push(new Elisp.ElementIndexer(leftHand, index));
					} else if (leftHandType.flags & ts.TypeFlags.String
							  || leftHandType.flags & ts.TypeFlags.StringLiteral) {
						console.log(`    123123123 string: ${leftHandType.flags} ` + indexer.expression.getText())
						context.push(new Elisp.StringIndexer(leftHand, index))
					} else {
						context.push(new Elisp.ElementIndexer(leftHand, index));
					}
					
				}
				break;
			case ts.SyntaxKind.ArrayLiteralExpression:
				{
					const arrayLiteral = <ts.ArrayLiteralExpression>node;

					const items = [];
					for (const item of arrayLiteral.elements) {
						items.push(
							parseAndExpect<Elisp.Expression>(item, context)
						);
					}

					context.push(new Elisp.ArrayLiteral(items));
				}
				break;
			case ts.SyntaxKind.ObjectLiteralExpression:
				{
					const objectLiteral = <ts.ObjectLiteralExpression>node;

					const properties = [];
					for (const property of objectLiteral.properties) {
						switch (property.kind) {
							case ts.SyntaxKind.PropertyAssignment:
								{
									const assignment = <ts.PropertyAssignment>(
										property
									);

									context.addSymbol({
										name: assignment.name.getText(),
										type: SymbolType.Variable
									});

									const identifier = parseAndExpect<
										Elisp.PropertyName
									>(assignment.name, context);
									const initializer = parseAndExpect<
										Elisp.Expression
									>(assignment.initializer, context);

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
										ts.ShorthandPropertyAssignment
									>property;
									toElispNode(shorthand.name, context);
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
								const spread = <ts.SpreadAssignment>property;
								throw new Error(
									'Spread operator not currently supported'
								);
							}
						}
						//toElispNode
					}
					context.push(new Elisp.ObjectLiteral(properties));
				}
				break;
			case ts.SyntaxKind.PropertyAccessExpression:
				{
					const propAccess = <ts.PropertyAccessExpression>node;

					const leftHand = parseAndExpect<Elisp.Expression>(
						propAccess.expression,
						context
					);
					const rightHand = parseAndExpect<Elisp.Identifier>(
						propAccess.name,
						context
					);

					context.push(new Elisp.PropertyAccess(leftHand, rightHand));
				}
				break;
			case ts.SyntaxKind.ArrowFunction:
				{
					const arrowFunc = <ts.ArrowFunction>node;
					const params = arrowFunc.parameters;
					const args = params
						? params.map(p => p.name.getText())
						: [];

					args.forEach(arg => {
						context.addSymbol({
							name: arg,
							type: SymbolType.Variable
						});
					});

					const lambda = context.push(new Elisp.Lambda(args));
					toElispNode(arrowFunc.body, context);
					context.resolveTo(lambda);
				}
				break;
			case ts.SyntaxKind.AsExpression:
				const asExpression = <ts.AsExpression>node;
				toElispNode(asExpression.expression, context)
				break
			case ts.SyntaxKind.TypeAliasDeclaration:
				break;
			case ts.SyntaxKind.ModuleDeclaration:
				break;
			case ts.SyntaxKind.ClassDeclaration:
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
			case ts.SyntaxKind.NullKeyword: {
				context.push(new Elisp.Null())
			} break
			case ts.SyntaxKind.ImportDeclaration:
				{
					const importDecl = <ts.ImportDeclaration>node;
					const moduleName = parseAndExpect<Elisp.StringLiteral>(
						importDecl.moduleSpecifier,
						context
					);

					let isRelativePath = true;
					//TODO: Make this more robust! We check here if we are looking at a path or an ambient(?) module import
					if (
						moduleName.str.indexOf('/') === -1 &&
						moduleName.str.indexOf('\\') === -1 &&
						moduleName.str.indexOf('.') === -1
					) {
						isRelativePath = false;
					}

					if (importDecl.importClause) {
						if (importDecl.importClause.namedBindings) {
							const namedBinding =
								importDecl.importClause.namedBindings;
							if (
								namedBinding.kind ===
								ts.SyntaxKind.NamespaceImport
							) {
								//Need to create an elisp object with the entire namespace
								const namespaceIdentifier = parseAndExpect<Elisp.Identifier>(namedBinding.name, context);
								const namespaceType = context.typeChecker.getTypeAtLocation(namedBinding)

								const members = []
								const properties =  namespaceType.getProperties()
								for (const p of properties) {
									const declaration = p.valueDeclaration
									if (declaration) {
										if (declaration.kind === ts.SyntaxKind.FunctionDeclaration) {
											const funDecl = <ts.FunctionDeclaration>declaration
											if (funDecl.name) {
												const propIdentifier = parseAndExpect<Elisp.Identifier>(funDecl.name, context)
												members.push(propIdentifier)
											}
											//TODO: Handle other types of declarations in namespace imports
										} else if (declaration.kind === ts.SyntaxKind.VariableDeclaration) {
											const variableDecl = <ts.VariableDeclaration>declaration
											context.addSymbol({
												name: variableDecl.name.getText(),
												type: SymbolType.Variable
											})
											const variable = parseAndExpect<Elisp.Identifier>(variableDecl.name, context)
											members.push(variable)
										}
									}
								}
								context.push(new Elisp.NamespaceImport(namespaceIdentifier, members, moduleName, isRelativePath))
							} else if (namedBinding.kind === ts.SyntaxKind.NamedImports) {
								context.push(
									new Elisp.ModuleImport(moduleName, isRelativePath)
								);
							}
						}
					}

					context.resolveToCurrentScope();
				}
				break;
			default:
				throw new Error('Unsupported ast item: ' + node.kind);
		}
	})();
	context.decStackCount();
}

function addCommonLibs(root: Elisp.RootScope) {
	root.pushExpression(
		new Elisp.ModuleImport(new Elisp.StringLiteral('./ts-lib'), true)
	);
}

function toElisp(sourceFile: ts.SourceFile, context: Context) {
	const root = new Elisp.RootScope();
	addCommonLibs(root);
	context.push(root);
	for (var statement of sourceFile.statements) {
		toElispNode(statement, context);
	}
	context.resolveTo(root);
}

interface CompilationResult {
	sourceFileName: string;
	output: string;
}

export function compileSources(program: ts.Program): CompilationResult[] {
	const typeChecker = program.getTypeChecker();

	const ret = [];

	const sourceFiles = program.getSourceFiles();
	for (const sourceFile of sourceFiles) {
		//To not build the default lib.ts file. Move or remove this?
		if (sourceFile.fileName.indexOf('lib.d.ts') !== -1) {
			continue
		}
		console.log('== Compiling source file: ' + sourceFile.fileName);
		// Walk the tree to search for classes
		const context = new Context(sourceFiles, typeChecker);
		toElisp(sourceFile, context);
		ret.push({
			sourceFileName: sourceFile.fileName,
			output: context.getElispSource()
		});
	}
	return ret;
}
