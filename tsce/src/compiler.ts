import * as ts from 'typescript';
import * as Elisp from './elispTypes';
import { Symbol, SymbolType, Context} from './context'
import { loadProjectFile, loadInputFiles, startProjectFromWorkingDir, compileProject } from './projectFormat'
import { createSourceFile, getSyntheticLeadingComments, getCommentRange, getLeadingCommentRanges } from 'typescript';
import { fail } from 'assert';


function parseAndExpect<T extends Elisp.Node>(node: ts.Node, context: Context) {
	const prevStackLen = context.stack.size
	toElispNode(node, context)

	const stackDiff = context.stack.size - prevStackLen
	if (stackDiff !== 1) {
		throw new Error("Expected stack to have one more item, but had " + stackDiff)
	}

	return context.stack.pop() as T
}

function toElispNode(node: ts.Node, context: Context) {
	context.incStackCount();
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
				const leftHand = parseAndExpect<Elisp.Expression>(ce.expression, context)
				let args = ce.arguments.map(a => {
					return parseAndExpect<Elisp.Expression>(a, context)
				});
				let funcall = new Elisp.FunctionCall(leftHand, args);
				context.stack.push(funcall);
				break;
			}
			case ts.SyntaxKind.VariableDeclaration:
				context.printAtStackOffset('VariableDeclaration: ', node);
				const vd = <ts.VariableDeclaration>node;
				let name = vd.name.getText();
				context.addSymbol({
					name,
					type: SymbolType.Variable
				})
				let initializer;
				if (vd.initializer) {
					initializer = parseAndExpect<Elisp.Expression>(vd.initializer, context)
				}
				context.stack.push(new Elisp.LetItem(name, initializer));
				break;

			case ts.SyntaxKind.VariableDeclarationList:
				context.printAtStackOffset('VariableDeclarationList', node);
				const vdl = <ts.VariableDeclarationList>node;

				const marker = context.stack.push(new Elisp.Body());
				for (let variable of vdl.declarations) {
					toElispNode(variable, context);
				}

				const bindings = context.stack.popTo(marker) as Elisp.LetItem[];
				context.stack.pop(); //pop marker

				let letBinding = new Elisp.LetBinding(bindings);
				context.stack.push(letBinding);
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
				})

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
					})
				})

				let defun = new Elisp.Defun(name.text, args);
				context.stack.push(defun);
				if (fd.body) {
					fd.body.statements.forEach(x => {
						toElispNode(x, context);
					});
				}

				context.stack.resolveToParentOf(defun);
				break;
			}
			case ts.SyntaxKind.Identifier: {
				context.printAtStackOffset('Identifier', node);
				const symbolName = (<ts.Identifier>node).text
				const symbol = context.getSymbolForName(symbolName)
				context.stack.push(new Elisp.Identifier(symbolName, symbol));
				break;
			}
			case ts.SyntaxKind.BinaryExpression: {
				context.printAtStackOffset('BinaryExpression: ', node);
				let be = <ts.BinaryExpression>node;

				const left = parseAndExpect<Elisp.Expression>(be.left, context)
				const right = parseAndExpect<Elisp.Expression>(be.right, context)

				let op = be.operatorToken;
				if (op.getText() === '=') {
					//TODO Not use string literal
					context.stack.push(
						new Elisp.Assignment(left as Elisp.Identifier, right)
					);
				} else {
					context.stack.push(
						new Elisp.BinaryExpression(op.getText(), left, right)
					);
				}
				break;
			}
			case ts.SyntaxKind.PostfixUnaryExpression:
				context.printAtStackOffset('PostfixUnaryExpression', node);
				const pue = <ts.PostfixUnaryExpression>node;
				const operator = pue.operator;

				const operand = parseAndExpect<Elisp.Expression>(pue.operand, context)

				context.stack.push(new Elisp.UnaryPostfixExpression(operator, operand));
				break;
			case ts.SyntaxKind.PrefixUnaryExpression: {
				context.printAtStackOffset('PrefixUnaryExpression');
				let pue = <ts.PrefixUnaryExpression>node;
				let operator = ts.tokenToString(pue.operator);

				const operand = parseAndExpect<Elisp.Expression>(pue.operand, context)

				context.stack.push(new Elisp.UnaryPrefixExpression(operator!, operand));
				break;
			}
			case ts.SyntaxKind.FalseKeyword: {
				context.printAtStackOffset('FalseKeyword');
				context.stack.push(new Elisp.BooleanLiteral(false));
				break;
			}
			case ts.SyntaxKind.TrueKeyword: {
				context.printAtStackOffset('TrueKeyword');
				context.stack.push(new Elisp.BooleanLiteral(true));
				break;
			}
			case ts.SyntaxKind.NumericLiteral: {
				context.printAtStackOffset('NumericLiteral');
				context.stack.push(
					new Elisp.NumberLiteral((<ts.NumericLiteral>node).text)
				);
				break;
			}
			case ts.SyntaxKind.StringLiteral: {
				context.printAtStackOffset('StringLiteral');
				context.stack.push(
					new Elisp.StringLiteral((<ts.StringLiteral>node).text)
				);
				break;
			}
			case ts.SyntaxKind.IfStatement: {
				context.printAtStackOffset('IfStatement');
				let ifExp = <ts.IfStatement>node;

				const predicate = parseAndExpect<Elisp.Expression>(ifExp.expression, context)

				const ifBody = context.stack.push(new Elisp.Body());

				for (let expr of (<ts.Block>ifExp.thenStatement).statements) {
					toElispNode(expr, context);
				}
				context.stack.resolveTo(ifBody);
				context.stack.pop();

				let elseBody;
				if (ifExp.elseStatement) {
					elseBody = context.stack.push(new Elisp.Body());
					if (
						ifExp.elseStatement.kind === ts.SyntaxKind.IfStatement
					) {
						toElispNode(ifExp.elseStatement, context);
					} else {
						for (let expr of (<ts.Block>ifExp.thenStatement).statements) {
							toElispNode(expr, context);
						}
					}
					context.stack.resolveTo(elseBody);
					context.stack.pop();
				}

				context.stack.push(
					new Elisp.IfExpression(predicate, ifBody, elseBody)
				);
				break;
			}
			case ts.SyntaxKind.ReturnStatement:
				const retStatement = <ts.ReturnStatement>node;
				let returnValue;
				if (retStatement.expression) {
					returnValue = parseAndExpect<Elisp.Expression>(retStatement.expression, context)
				}
				context.stack.push(
					new Elisp.ReturnStatement(
						context.stack.getCurrentBlock().blockId,
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
						init = parseAndExpect<Elisp.LetBinding>(initializer, context)
					}

					const condition = forStatement.condition;
					let cond;
					if (condition) {
						cond = parseAndExpect<Elisp.Expression>(condition, context)
					}

					const incrementor = forStatement.incrementor;
					let inc;
					if (incrementor) {
						inc = parseAndExpect<Elisp.Expression>(incrementor, context)
					}

					const f = context.stack.push(
						new Elisp.ForStatement(init, cond, inc)
					);

					toElispNode(forStatement.statement, context);
					context.stack.resolveTo(f);
				}
				break;
			case ts.SyntaxKind.ElementAccessExpression: {
				const indexer = <ts.ElementAccessExpression>node

				const leftHand = parseAndExpect<Elisp.Expression>(indexer.expression, context)
				const index = parseAndExpect<Elisp.Expression>(indexer.argumentExpression!, context)

				context.stack.push(new Elisp.ArrayIndexer(leftHand, index))
			} break
			case ts.SyntaxKind.ArrayLiteralExpression: {
				const arrayLiteral = <ts.ArrayLiteralExpression>node

				const items = []
				for (const item of arrayLiteral.elements) {
					items.push(parseAndExpect<Elisp.Expression>(item, context))
				}

				context.stack.push(new Elisp.ArrayLiteral(items))
			} break
			case ts.SyntaxKind.ObjectLiteralExpression: {
				const objectLiteral = <ts.ObjectLiteralExpression>node

				const properties = []
				for (const property of objectLiteral.properties) {
					switch (property.kind) {
						case ts.SyntaxKind.PropertyAssignment: {
							const assignment = <ts.PropertyAssignment>property

							context.addSymbol({
								name: assignment.name.getText(),
								type: SymbolType.Variable
							})

							const identifier = parseAndExpect<Elisp.PropertyName>(assignment.name, context)
							const initializer = parseAndExpect<Elisp.Expression>(assignment.initializer, context)

							properties.push(new Elisp.Property(identifier, initializer))
						} break
						case ts.SyntaxKind.ShorthandPropertyAssignment: {
							const shorthand = <ts.ShorthandPropertyAssignment>property
							toElispNode(shorthand.name, context)
							const identifier = context.stack.pop() as Elisp.Identifier
							properties.push(new Elisp.Property(identifier, identifier))
						} break
						case ts.SyntaxKind.SpreadAssignment: {
							const spread = <ts.SpreadAssignment>property
							throw new Error("Spread operator not currently supported")
						}
					}
					//toElispNode
				}
				context.stack.push(new Elisp.ObjectLiteral(properties))
			} break
			case ts.SyntaxKind.PropertyAccessExpression: {
				const propAccess = <ts.PropertyAccessExpression>node

				const leftHand = parseAndExpect<Elisp.Expression>(propAccess.expression, context)
				const rightHand = parseAndExpect<Elisp.Identifier>(propAccess.name, context)

				context.stack.push(new Elisp.PropertyAccess(leftHand, rightHand))
			} break
			case ts.SyntaxKind.ArrowFunction: {
				const arrowFunc = <ts.ArrowFunction>node
				const params = arrowFunc.parameters
				const args = params
					? params.map(p => p.name.getText())
					: [];

				args.forEach(arg => {
					context.addSymbol({
						name: arg,
						type: SymbolType.Variable
					})
				})

				const lambda = context.stack.push(new Elisp.Lambda(args))
				toElispNode(arrowFunc.body, context)
				context.stack.resolveTo(lambda)

			} break
			case ts.SyntaxKind.ParenthesizedExpression: {
			} break
			case ts.SyntaxKind.InterfaceDeclaration: {
			} break
			case ts.SyntaxKind.SingleLineCommentTrivia: {
				//const singleLineComment = <ts.SingleLineCommentTrivia>node
			} break
			case ts.SyntaxKind.ImportDeclaration: {
				const importDecl = <ts.ImportDeclaration>node
				const moduleName = parseAndExpect<Elisp.StringLiteral>(importDecl.moduleSpecifier, context)

				let isRelativePath = true
				//TODO: Make this more robust! We check here if we are looking at a path or an ambient(?) module import
				if (moduleName.str.indexOf('/') === -1
					&& moduleName.str.indexOf('\\') === -1
					&& moduleName.str.indexOf('.') === -1) {
					isRelativePath = false
				}
				context.stack.push(new Elisp.ModuleImport(moduleName, isRelativePath))
				context.stack.resolveToCurrentScope()
			} break
			default:
				throw new Error('Unsupported ast item: ' + node.kind);
		}
	})();
	context.decStackCount();
}

function addCommonLibs(root: Elisp.RootScope) {
	root.pushExpression(new Elisp.ModuleImport(new Elisp.StringLiteral('./ts-lib'), true))
}

function toElisp(sourceFile: ts.SourceFile, context: Context) {
	const root = new Elisp.RootScope();
	addCommonLibs(root)
	context.stack.push(root);
	for (var statement of sourceFile.statements) {
		toElispNode(statement, context);
	}
	context.stack.resolveTo(root)
}

export function compileSource(source: string) {
	const tsSource = ts.createSourceFile(
		'../test.tselisp',
		source,
		ts.ScriptTarget.ES2015,
		/*setParentNodes */ true
	);
	//TODO: Make context.stack a part of the context and not a global variable
	const context = new Context(tsSource)
	toElisp(tsSource, context)
	return context.stack.getElispSource()
}
