import * as ts from 'typescript';
import * as fs from 'fs';

import * as Elisp from './elispTypes';
import Stack from './stack'
import { Symbol, SymbolType, Context} from './context'

let stack = new Stack();

let stackCount = 0;

function getCallStackSize() {
	return stackCount;
}

function stackSizeTabs() {
	const stackSize = getCallStackSize();
	return Elisp.tabs(stackSize);
}

function printAtStackOffset(text: string, node?: ts.Node) {
	let scope = '<no scope>';
	try {
		scope = stack.getCurrentScope().type;
	} catch (e) {
		console.log('Error : ' + e);
	}
	console.log(
		stackSizeTabs() + text + " - " + (node ? node.getText() : "") + ' scope: ' + scope + ', size: ' + stack.size
	);
}

function parseAndExpect<T extends Elisp.Node>(node: ts.Node, context: Context) {
	const prevStackLen = stack.size
	toElispNode(node, context)

	const stackDiff = stack.size - prevStackLen
	if (stackDiff !== 1) {
		throw new Error("Expected stack to have one more item, but had " + stackDiff)
	}

	return stack.pop() as T
}

function toElispNode(node: ts.Node, context: Context) {
	stackCount++;
	(() => {
		switch (node.kind) {
			case ts.SyntaxKind.ExpressionStatement:
				printAtStackOffset('ExpressionStatement', node);
				let es = <ts.ExpressionStatement>node;
				toElispNode(es.expression, context);
				break;

			case ts.SyntaxKind.CallExpression: {
				printAtStackOffset('CallExpression', node);
				let ce = <ts.CallExpression>node;
				const leftHand = parseAndExpect<Elisp.Expression>(ce.expression, context)
				let args = ce.arguments.map(a => {
					return parseAndExpect<Elisp.Expression>(a, context)
				});
				let funcall = new Elisp.FunctionCall(leftHand, args);
				stack.push(funcall);
				break;
			}
			case ts.SyntaxKind.VariableDeclaration:
				printAtStackOffset('VariableDeclaration: ', node);
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
				stack.push(new Elisp.LetItem(name, initializer));
				break;

			case ts.SyntaxKind.VariableDeclarationList:
				printAtStackOffset('VariableDeclarationList', node);
				const vdl = <ts.VariableDeclarationList>node;

				const marker = stack.push(new Elisp.Body());
				//console.log("Before declarations: ", stack)
				for (let variable of vdl.declarations) {
					toElispNode(variable, context);
				}

				//console.log("Popping to with stack", stack)
				const bindings = stack.popTo(marker) as Elisp.LetItem[];
				stack.pop(); //pop marker

				let letBinding = new Elisp.LetBinding(bindings);
				stack.push(letBinding);
				break;

			case ts.SyntaxKind.VariableStatement: {
				printAtStackOffset('VariableStatement', node);
				let vs = <ts.VariableStatement>node;
				toElispNode(vs.declarationList, context);

				break;
			}
			case ts.SyntaxKind.FunctionDeclaration: {
				printAtStackOffset('FunctionDeclaration', node);
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
				stack.push(defun);
				if (fd.body) {
					fd.body.statements.forEach(x => {
						toElispNode(x, context);
					});
				}

				stack.resolveToParentOf(defun);
				break;
			}
			case ts.SyntaxKind.Identifier: {
				printAtStackOffset('Identifier', node);
				const symbolName = (<ts.Identifier>node).text
				const symbol = context.getSymbolForName(symbolName)
				stack.push(new Elisp.Identifier(symbolName, symbol));
				break;
			}
			case ts.SyntaxKind.BinaryExpression: {
				printAtStackOffset('BinaryExpression: ', node);
				let be = <ts.BinaryExpression>node;

				const left = parseAndExpect<Elisp.Expression>(be.left, context)
				const right = parseAndExpect<Elisp.Expression>(be.right, context)

				let op = be.operatorToken;
				if (op.getText() === '=') {
					//TODO Not use string literal
					stack.push(
						new Elisp.Assignment(left as Elisp.Identifier, right)
					);
				} else {
					stack.push(
						new Elisp.BinaryExpression(op.getText(), left, right)
					);
				}
				break;
			}
			case ts.SyntaxKind.PostfixUnaryExpression:
				printAtStackOffset('PostfixUnaryExpression', node);
				const pue = <ts.PostfixUnaryExpression>node;
				const operator = pue.operator;

				const operand = parseAndExpect<Elisp.Expression>(pue.operand, context)

				stack.push(new Elisp.UnaryPostfixExpression(operator, operand));
				break;
			case ts.SyntaxKind.PrefixUnaryExpression: {
				printAtStackOffset('PrefixUnaryExpression');
				let pue = <ts.PrefixUnaryExpression>node;
				let operator = ts.tokenToString(pue.operator);

				const operand = parseAndExpect<Elisp.Expression>(pue.operand, context)

				stack.push(new Elisp.UnaryPrefixExpression(operator!, operand));
				break;
			}
			case ts.SyntaxKind.FalseKeyword: {
				printAtStackOffset('FalseKeyword');
				stack.push(new Elisp.BooleanLiteral(false));
				break;
			}
			case ts.SyntaxKind.TrueKeyword: {
				printAtStackOffset('TrueKeyword');
				stack.push(new Elisp.BooleanLiteral(true));
				break;
			}
			case ts.SyntaxKind.NumericLiteral: {
				printAtStackOffset('NumericLiteral');
				stack.push(
					new Elisp.NumberLiteral((<ts.NumericLiteral>node).text)
				);
				break;
			}
			case ts.SyntaxKind.StringLiteral: {
				printAtStackOffset('StringLiteral');
				stack.push(
					new Elisp.StringLiteral((<ts.StringLiteral>node).text)
				);
				break;
			}
			case ts.SyntaxKind.IfStatement: {
				printAtStackOffset('IfStatement');
				let ifExp = <ts.IfStatement>node;

				const predicate = parseAndExpect<Elisp.Expression>(ifExp.expression, context)

				const ifBody = stack.push(new Elisp.Body());

				console.log('Making body of if');
				for (let expr of (<ts.Block>ifExp.thenStatement).statements) {
					toElispNode(expr, context);
				}
				console.log('current stack', stack);
				stack.resolveTo(ifBody);
				stack.pop();

				console.log('  We have body');

				let elseBody;
				if (ifExp.elseStatement) {
					elseBody = stack.push(new Elisp.Body());
					if (
						ifExp.elseStatement.kind === ts.SyntaxKind.IfStatement
					) {
						console.log('It was an elseif');
						toElispNode(ifExp.elseStatement, context);
					} else {
						console.log('We have the else clause');
						for (let expr of (<ts.Block>ifExp.thenStatement).statements) {
							toElispNode(expr, context);
						}
					}
					stack.resolveTo(elseBody);
					stack.pop();
				}

				stack.push(
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
				stack.push(
					new Elisp.ReturnStatement(
						stack.getCurrentBlock().blockId,
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

					const f = stack.push(
						new Elisp.ForStatement(init, cond, inc)
					);

					toElispNode(forStatement.statement, context);
					stack.resolveTo(f);
				}
				break;
			case ts.SyntaxKind.ElementAccessExpression: {
				const indexer = <ts.ElementAccessExpression>node

				const leftHand = parseAndExpect<Elisp.Expression>(indexer.expression, context)
				const index = parseAndExpect<Elisp.Expression>(indexer.argumentExpression!, context)

				stack.push(new Elisp.ArrayIndexer(leftHand, index))
			} break
			case ts.SyntaxKind.ArrayLiteralExpression: {
				const arrayLiteral = <ts.ArrayLiteralExpression>node

				const items = []
				for (const item of arrayLiteral.elements) {
					items.push(parseAndExpect<Elisp.Expression>(item, context))
				}

				stack.push(new Elisp.ArrayLiteral(items))
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
							const identifier = stack.pop() as Elisp.Identifier
							properties.push(new Elisp.Property(identifier, identifier))
						} break
						case ts.SyntaxKind.SpreadAssignment: {
							const spread = <ts.SpreadAssignment>property
							throw new Error("Spread operator not currently supported")
						}
					}
					//toElispNode
				}
				stack.push(new Elisp.ObjectLiteral(properties))
			} break
			case ts.SyntaxKind.PropertyAccessExpression: {
				const propAccess = <ts.PropertyAccessExpression>node

				const leftHand = parseAndExpect<Elisp.Expression>(propAccess.expression, context)
				const rightHand = parseAndExpect<Elisp.Identifier>(propAccess.name, context)

				stack.push(new Elisp.PropertyAccess(leftHand, rightHand))
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

				const lambda = stack.push(new Elisp.Lambda(args))
				toElispNode(arrowFunc.body, context)
				stack.resolveTo(lambda)

			} break
			case ts.SyntaxKind.ParenthesizedExpression: {
			} break
			case ts.SyntaxKind.InterfaceDeclaration: {
			} break
			case ts.SyntaxKind.ImportDeclaration: {
				const importDecl = <ts.ImportDeclaration>node
				const moduleName = parseAndExpect<Elisp.StringLiteral>(importDecl.moduleSpecifier, context)
				console.log("MODULE NAME: " + moduleName.str)
				stack.push(new Elisp.ModuleImport(moduleName))
				stack.resolveToCurrentScope()
			} break
			default:
				throw new Error('Unsupported ast item: ' + node.kind);
		}
	})();
	stackCount--;
}

export function toElisp(sourceFile: ts.SourceFile) {
	const context = new Context()
	const root = new Elisp.RootScope();
	stack.push(root);
	for (var statement of sourceFile.statements) {
		toElispNode(statement, context);
	}
	stack.resolveTo(root)
}

function parseTypescriptFile(filePath: string) {
	let fileSource = fs.readFileSync(filePath).toString();
	return ts.createSourceFile(
		'../test.tselisp',
		fileSource,
		ts.ScriptTarget.ES2015,
		/*setParentNodes */ true
	);
}

const args = process.argv.slice(2)
console.log("Args: ", args)

args.forEach(x => {
	console.log("Input: ", x)
})

if (args.length === 0) {
	console.error('Expecting file as first argument');
}

let filePath = args[0];
console.log("File path: " + filePath)
let sourceFile = parseTypescriptFile(filePath);

toElisp(sourceFile);

let output = stack.getElispSource();
console.log('\nElisp:');
console.log('==========');
console.log(output);

const outputFile = args[1]

const library = fs.readFileSync("tsce/src/ts-lib.el")

fs.writeFileSync(outputFile, library + "\n " + output)

console.log('Output: ' + JSON.stringify(stack));

//stack.forEach(x => x.emit(0))
console.log('Output: ' + stack.size);
