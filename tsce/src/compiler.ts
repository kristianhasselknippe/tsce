import * as ts from 'typescript';
import * as Elisp from './elispTypes';
import { Symbol, SymbolType, Context } from './context';
import {
	loadProjectFile,
	loadInputFiles,
	startProjectFromWorkingDir,
	compileProject
} from './projectFormat';
import {
	createSourceFile,
	getSyntheticLeadingComments,
	getCommentRange,
    getLeadingCommentRanges,
    SymbolTable,
    createLanguageService
} from 'typescript';
import { fail } from 'assert';

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

function toElispNode(node: ts.Node, context: Context) {
	context.incStackCount();
	const nodeComments = context.getCommentsForNode(node);

	(() => {
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
				let funcall = new Elisp.FunctionCall(leftHand, args);
				context.push(funcall);
				break;
			}
			case ts.SyntaxKind.VariableDeclaration:
				context.printAtStackOffset('VariableDeclaration: ', node);
				const vd = <ts.VariableDeclaration>node;
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
				context.push(new Elisp.LetItem(name, initializer));
				break;

			case ts.SyntaxKind.VariableDeclarationList:
				context.printAtStackOffset('VariableDeclarationList', node);
				const vdl = <ts.VariableDeclarationList>node;

				const marker = context.push(new Elisp.Body());
				for (let variable of vdl.declarations) {
					toElispNode(variable, context);
				}

				const bindings = context.popTo(marker) as Elisp.LetItem[];
				context.pop(); //pop marker

				let letBinding = new Elisp.LetBinding(bindings);
				context.push(letBinding);
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

				let name = fd.name!;
				context.addSymbol({
					name: name.getText(),
					type: SymbolType.Function
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

				let defun = new Elisp.Defun(name.text, args, nodeComments);
				context.push(defun);
				if (fd.body) {
					fd.body.statements.forEach(x => {
						toElispNode(x, context);
					});
				}

				context.resolveToParentOf(defun);
				break;
			}
			case ts.SyntaxKind.Identifier: {
				context.printAtStackOffset('Identifier', node);
				const symbolName = (<ts.Identifier>node).text;
				const symbol = context.getSymbolForName(symbolName);
				context.push(new Elisp.Identifier(symbolName, symbol));
				break;
			}
			case ts.SyntaxKind.ParenthesizedExpression:
				context.printAtStackOffset('ParenthesizedExpression: ', node);
				let pe = <ts.ParenthesizedExpression>node;
				toElispNode(pe.expression, context)
				break
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

					context.push(new Elisp.ArrayIndexer(leftHand, index));
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
			case ts.SyntaxKind.ParenthesizedExpression:
				{
				}
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
			case ts.SyntaxKind.ConditionalExpression:
				{
					throw new Error("Unrecognized language feature: ConditionalExpression")
				}
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
					context.push(
						new Elisp.ModuleImport(moduleName, isRelativePath)
					);
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

function createProgram(fileNames: string[]) {
	const options = {
		noEmitOnError: true,
		noImplicitAny: true,
		target: ts.ScriptTarget.ES5,
		module: ts.ModuleKind.CommonJS
	}
	return ts.createProgram(fileNames, options)
}

function compileSource(source: string, symbolTable: SymbolTable) {
	const tsSource = ts.createSourceFile(
		'../test.tselisp',
		source,
		ts.ScriptTarget.ES2015,
		/*setParentNodes */ true
	);

	//TODO: Make context a part of the context and not a global variable
	const context = new Context(tsSource);
	toElisp(tsSource, context);
	return context.getElispSource();
}

interface CompilationResult {
	sourceFileName: string
	output: string
}

export function compileSources(sources: string[]): CompilationResult[] {
	const program = createProgram(sources)
	const typeChecker = program.getTypeChecker()

	const ret = []

	for (const sourceFile of program.getSourceFiles()) {
		console.log("== Compiling source file: " + sourceFile.fileName)
		if (!sourceFile.isDeclarationFile) {
			// Walk the tree to search for classes
			const context = new Context(sourceFile);
			toElisp(sourceFile, context);
			ret.push({
				sourceFileName: sourceFile.fileName,
				output: context.getElispSource()
			})
		}
	}
	return ret
}
