import { Project } from 'ts-simple-ast'
import chalk from 'chalk'
import * as IR from './ir'
import * as EL from './elispTypes'
import { TsceProject } from './projectFormat';
import { Parser } from './parser';
import { Defun } from './elispTypes';


/*function getDeclarationOfNode(node: Node) {
	const nodeSymbol = node.getType().getSymbol();
	if (nodeSymbol) {
		return nodeSymbol.getDeclarations();
	}
}

function getCommentsForDeclarationOfNode(node: Node) {
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

function getArgumentsOfFunctionDeclaration(funDecl: FunctionDeclaration) {
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

function getCompilerDirectivesForNode(node: Node) {
	const nodeComments = this.context.getCommentsForNode(node);
	const compilerDirectives = extractCompilerDirectivesFromStrings(
		nodeComments
	);
	return compilerDirectives;
}

function nodeHasCompilerDirectiveKind(
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

function compilerDirectivesOfDeclarationOfNode(node: Node) {
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

function declarationOfNodeHasCompilerDirectiveKind(
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



function getNamedArgumentNamesForCallExpression(node: CallExpression) {
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

function getMembersOfInterfaceDeclaration(node: InterfaceDeclaration) {
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
	}*/

interface Addable<T> {
	add(item: T): void
}

function constructorName(item: any) {
	return item.constructor.name as string
}

type Scope<T> = T & Addable<T>

class ScopeStack<T> {
	private items: T[] = []

	constructor(readonly scope: Scope<T>) { }

	push(item: T) {
		this.items.push(item)
		return item
	}

	pop() {
		return this.items.pop()!
	}

	peek() {
		return this.items[this.items.length - 1]
	}

	resolve() {
		this.items.forEach(x => {
			this.scope.add(x)
		})
		this.items = []
	}

	get isEmpty() {
		return this.items.length === 0
	}
}

export class Stack<T> {
	private stack: ScopeStack<T>[] = []

	private get lastScopeStack() {
		return this.stack[this.stack.length - 1]
	}

	peek() {
		return this.lastScopeStack.peek()
	}

	pop() {
		if (this.lastScopeStack.isEmpty) {
			return this.stack.pop()!.scope
		} else {
			return this.lastScopeStack.pop()
		}
	}

	popScope() {
		if (this.stack.length === 0) {
			throw new Error('Attempted to pop scope from empty scope stack')
		}
		return this.stack.pop()!
	}

	push(item: T) {

		this.lastScopeStack.push(item)
	}

	getCurrentScopeMatchingPredicate(pred: (scope: T) => boolean): Scope<T> {
		for (let i = this.stack.length - 1; i > 0; i--) {
			const scope = this.stack[i]
			if (pred(scope.scope)) {
				return scope.scope
			}
		}
		throw new Error("Could not find scope matching predicate: " + pred)
	}

	pushScope<TScope extends (T & Addable<T>)>(scope: TScope): ScopeStack<TScope> {
		const scopeStack = new ScopeStack<TScope>(scope)
		this.stack.push(scopeStack)
		return scopeStack
	}

	getParentScopeOf(scope: ScopeStack<T>): ScopeStack<T> {
		for (let i = 0; i < this.stack.length; i++) {
			if (this.stack[i] === scope) {
				if (i === 0) {
					throw "Tried to return parent scope of root scope"
				}
				return this.stack[i-1]
			}
		}
		throw new Error(`Could not find parent scope of: ${constructorName(scope.scope)}`)
	}

	print(msg?: string) {
		if (msg) {
			console.log(msg)
		}
		console.log("STACK: ", this.stack)
	}

	resolveCurrentScope() {
		this.lastScopeStack.resolve()
		const lastScope = this.popScope()!.scope
		this.lastScopeStack.push(lastScope)
	}

	resolveTo<TOut extends T>(scope: ScopeStack<TOut>): TOut {
		while (this.lastScopeStack !== scope) {
			this.resolveCurrentScope()
		}
		this.lastScopeStack.resolve()
		return scope.scope
	}

	resolveToParentOf<TOut extends T>(scope: ScopeStack<TOut>): TOut {
		const parent = this.getParentScopeOf(scope)
		this.resolveTo(parent)
		return scope.scope
	}
}

class Compiler {
	constructor(readonly project: Project) { }

	context = new Stack<EL.Node>()

	compileAndExpect<TOut extends EL.Node>(node: IR.Node): TOut
	compileAndExpect<TOut extends EL.Node>(node: IR.Node | undefined): TOut | undefined
	compileAndExpect<TOut extends EL.Node>(node: IR.Node | undefined) {
		if (typeof node === 'undefined') {
			return
		}
		if (this.compileNode(node) !== -1) {
			return this.context.pop() as TOut
		}
	}

	compileIdentifier(identifier: IR.Identifier) {
		this.context.push(new EL.Identifier(identifier.name))
	}

	compileIf(ifNode: IR.If) {
		const pred = this.compileAndExpect<EL.Expression>(ifNode.thenCondition)

		const body = this.compileAndExpect<EL.Body>(ifNode.thenBlock)
		const elseBody = this.compileAndExpect<EL.Body>(ifNode.elseItem)

		this.context.push(new EL.IfExpression(pred, body, elseBody))
	}

	compileFunctionDeclaration(functionDecl: IR.FunctionDeclaration) {
		const name = this.compileAndExpect<EL.Identifier>(functionDecl.name)
		const args = functionDecl.args
			.map(x => this.compileAndExpect<EL.Identifier>(x))
			.map(identifier => new EL.FunctionArg(identifier))

		const scope = this.context.pushScope(new EL.Defun(name, args))
		this.compileNodeList(functionDecl.body)
		this.context.resolveToParentOf(scope)
	}

	compileVariableDeclaration(varDecl: IR.VariableDeclaration) {
		const identifier = this.compileAndExpect<EL.Identifier>(varDecl.name)
		const initializer = this.compileAndExpect<EL.Expression>(varDecl.initializer)
		this.context.push(new EL.LetItem(identifier, initializer))
	}

	compileVariableDeclarationList(varDeclList: IR.VariableDeclarationList) {
		const declarations = varDeclList.variables.map(x => this.compileAndExpect<EL.LetItem>(x))
		const letBinding = new EL.LetBinding(declarations)
		this.context.pushScope(letBinding)
	}

	compileSourceFile(sourceFile: IR.SourceFile) {
		const scope = this.context.pushScope(new EL.SourceFile())
		this.compileNodeList(sourceFile.statements)
		this.context.resolveTo(scope)
	}

	compileNodeList(nodes: IR.Node[]) {
		nodes
			.filter(x => typeof x !== "undefined")
			.forEach(x => this.compileNode(x))
	}

	compileStringLiteral(lit: IR.StringLiteral) {
		this.context.push(new EL.StringLiteral(lit.value))
	}

	compileNumberLiteral(lit: IR.NumberLiteral) {
		this.context.push(new EL.NumberLiteral(lit.value))
	}

	compileAssignment(assign: IR.Assignment) {
		const left = this.compileAndExpect<EL.Expression>(assign.left)
		const right = this.compileAndExpect<EL.Expression>(assign.right)
		this.context.push(new EL.Assignment(left, right))
	}

	compileBinaryExpr(expr: IR.BinaryExpr) {
		const left = this.compileAndExpect<EL.Expression>(expr.left)
		const right = this.compileAndExpect<EL.Expression>(expr.right)
		this.context.push(new EL.BinaryExpression(expr.operator, left, right))
	}

	compileBlock(block: IR.Block) {
		const body = this.context.pushScope(new EL.Body())
		this.compileNodeList(block.statements)
		this.context.resolveTo(body)
		const res = this.context.pop()
		this.context.push(res)
	}

	compileReturn(ret: IR.ReturnStatement) {
		//TODO: Make the return of getCurrentscopematchingpredicate typesafe
		this.context.print()
		const parentFunc = this.context.getCurrentScopeMatchingPredicate(scope => scope instanceof EL.Defun) as EL.Defun
		const retValue = this.compileAndExpect<EL.Expression>(ret.returnValue)
		this.context.push(new EL.ReturnStatement(parentFunc.blockId, retValue))
	}

	compileObjectLiteral(objLit: IR.ObjectLiteral) {
		const props = objLit.properties.map(x => this.compileAndExpect<EL.Property>(x))
		this.context.push(new EL.ObjectLiteral(props))
	}

	compileObjectProperty(objProp: IR.ObjectProperty) {
		const identifier = this.compileAndExpect<EL.Identifier>(objProp.name)
		const value = this.compileAndExpect<EL.Expression>(objProp.value)
		this.context.push(new EL.Property(identifier, value))
	}

	compilePropertyAccess(propAccess: IR.PropertyAccess) {
		const left = this.compileAndExpect<EL.Expression>(propAccess.left)
		const right = this.compileAndExpect<EL.Identifier>(propAccess.right)
		this.context.push(new EL.PropertyAccess(left, right))
	}

	compileElementAccess(elemAccess: IR.ElementAccess) {
		const left = this.compileAndExpect<EL.Expression>(elemAccess.left)
		const indexer = this.compileAndExpect<EL.Expression>(elemAccess.indexer)
		//TODO: Pick correct indexer type based on the type
		this.context.push(new EL.ElementIndexer(left, indexer))
	}

	compileArrayLiteral(arrLit: IR.ArrayLiteral) {
		const items = arrLit.items.map(x => this.compileAndExpect<EL.Expression>(x))
		this.context.push(new EL.ArrayLiteral(items))
	}

	compileEnumMember(enumMember: IR.EnumMember) {
		const name = this.compileAndExpect<EL.Identifier | EL.StringLiteral>(enumMember.name)
		const initializer = this.compileAndExpect<EL.Expression>(enumMember.initializer)
		this.context.push(new EL.EnumMember(name, initializer))
	}

	compileEnumDeclaration(enumDecl: IR.EnumDeclaration) {
		const identifier = this.compileAndExpect<EL.Identifier>(enumDecl.name)
		const members = enumDecl.members.map(x => this.compileAndExpect<EL.EnumMember>(x))
		this.context.push(new EL.Enum(identifier, members))
	}

	compileCallExpression(callExpr: IR.CallExpression) {
		const left = this.compileAndExpect<EL.Node>(callExpr.expression)
		const args = callExpr.args.map(arg => this.compileAndExpect<EL.Expression>(arg))
		//TODO: Handle all the call types
		this.context.push(new EL.FunctionCallDefun(left as EL.Identifier, args))
	}

	compileFor(forNode: IR.For) {
		const init = this.compileAndExpect<EL.LetBinding>(forNode.initializer)
		const cond = this.compileAndExpect<EL.Expression>(forNode.condition)
		const inc = this.compileAndExpect<EL.Expression>(forNode.incrementor)
		const scope = this.context.pushScope(new EL.ForStatement(init, cond, inc))
		this.compileNode(forNode.body)
		this.context.resolveToParentOf(scope)
	}

	compileForOf(forOf: IR.ForOf) {
		const variable = this.compileAndExpect<EL.LetBinding>(forOf.variable)
		const expression = this.compileAndExpect<EL.Expression>(forOf.expression)
		const scope = this.context.pushScope(new EL.ForOf(variable, expression))
		this.compileNode(forOf.body)
		this.context.resolveToParentOf(scope)
	}

	compileForIn(forIn: IR.ForIn) {
		throw new Error("For in statement are currently not supported")
	}

	compileWhile(whileNode: IR.While) {
		throw new Error("While statements are currently not supported")
	}

	compileUnaryPostfix(node: IR.UnaryPostfix) {
		console.log(chalk.bgCyan('Unary postfix: '), node)
		const operand = this.compileAndExpect<EL.Expression>(node.operand)
		let operator: EL.UnaryPostfixOp
		switch (node.operator) {
			case '++':
				operator = EL.UnaryPostfixOp.PlusPlus
				break
			case '--':
				operator = EL.UnaryPostfixOp.MinusMinus
				break
			default:
				throw new Error('Unknown postfix operator: ' + node.operator)
		}
		this.context.push(new EL.UnaryPostfixExpression(operator, operand))
	}

	compileUnaryPrefix(node: IR.UnaryPrefix) {
		const operand = this.compileAndExpect<EL.Expression>(node)
		this.context.push(new EL.UnaryPrefixExpression(node.operator, operand))
	}

	compileDeleteExpression(node: IR.DeleteExpression) {
		const expr = this.compileAndExpect<EL.Expression>(node.expr)
		this.context.push(new EL.DeleteExpression(expr))
	}

	compileArrowFunction(arrowFunc: IR.ArrowFunction) {
		const args = arrowFunc.args.map(x => new EL.FunctionArg(this.compileAndExpect<EL.Identifier>(x)))
		const scope = this.context.pushScope(new EL.Lambda(args))
		this.compileNodeList(arrowFunc.body)
		this.context.resolveTo(scope)
	}

	compileNode(node?: IR.Node) {
		if (typeof node === 'undefined') {
			return
		}
		console.log("Compiling node: " + (node.constructor as any).name + ": " + node.print())
		switch (node.constructor) {
			case IR.SourceFile:
				this.compileSourceFile(<IR.SourceFile>node)
				break
			case IR.Identifier:
				this.compileIdentifier(<IR.Identifier>node)
				break
			case IR.FunctionDeclaration:
				this.compileFunctionDeclaration(<IR.FunctionDeclaration>node)
				break
			case IR.VariableDeclaration:
				this.compileVariableDeclaration(<IR.VariableDeclaration>node)
				break
			case IR.VariableDeclarationList:
				this.compileVariableDeclarationList(<IR.VariableDeclarationList>node)
				break
			case IR.Assignment:
				this.compileAssignment(<IR.Assignment>node)
				break
			case IR.BinaryExpr:
				this.compileBinaryExpr(<IR.BinaryExpr>node)
				break
			case IR.UnaryPrefix:
				this.compileUnaryPrefix(<IR.UnaryPrefix>node)
				break
			case IR.UnaryPostfix:
				this.compileUnaryPostfix(<IR.UnaryPostfix>node)
				break
			case IR.DeleteExpression:
				this.compileDeleteExpression(<IR.DeleteExpression>node)
				break
			case IR.EnumMember:
				this.compileEnumMember(<IR.EnumMember>node)
				break
			case IR.EnumDeclaration:
				this.compileEnumDeclaration(<IR.EnumDeclaration>node)
				break
			case IR.ArrayLiteral:
				this.compileArrayLiteral(<IR.ArrayLiteral>node)
				break
			case IR.ElementAccess:
				this.compileElementAccess(<IR.ElementAccess>node)
				break
			case IR.PropertyAccess:
				this.compilePropertyAccess(<IR.PropertyAccess>node)
				break
			case IR.ObjectProperty:
				this.compileObjectProperty(<IR.ObjectProperty>node)
				break
			case IR.ObjectLiteral:
				this.compileObjectLiteral(<IR.ObjectLiteral>node)
				break
			case IR.StringLiteral:
				this.compileStringLiteral(<IR.StringLiteral>node)
				break
			case IR.NumberLiteral:
				this.compileNumberLiteral(<IR.NumberLiteral>node)
				break
			case IR.BooleanLiteral:
				break
			case IR.Block:
				this.compileBlock(<IR.Block>node)
				break
			case IR.CallExpression:
				this.compileCallExpression(<IR.CallExpression>node)
				break
			case IR.If:
				this.compileIf(<IR.If>node)
				break
			case IR.For:
				this.compileFor(<IR.For>node)
				break
			case IR.ForOf:
				this.compileForOf(<IR.ForOf>node)
				break
			case IR.ForIn:
				this.compileForIn(<IR.ForIn>node)
				break
			case IR.While:
				this.compileWhile(<IR.While>node)
				break
			case IR.ArrowFunction:
				this.compileArrowFunction(<IR.ArrowFunction>node)
				break
			case IR.ReturnStatement:
				this.compileReturn(<IR.ReturnStatement>node)
				break
			case IR.NamedImport:break
			case IR.NamespaceImport:break
			case IR.ModuleDeclaration:break
			case IR.Null:
				this.context.push(new EL.Null())
				break
			default:
				//throw new Error("Unsupported IR type: " + ((node.constructor as any).name))
				return -1
		}
	}

	generateElisp(ast: IR.SourceFile) {
		this.compileNode(ast)
		return this.context.popScope().scope as EL.SourceFile
	}

	compile(): CompilationResult[] {
		const parser = new Parser()
		const ret: CompilationResult[] = [];
		for (const sourceFile of this.project.getSourceFiles()) {
			console.log(chalk.blueBright('    - Compiling file: ') + sourceFile.getFilePath())
			//TODO: Add ts-lib.el import to top
			const sourceBody = parser.parseFile(sourceFile)
			const elisp = this.generateElisp(sourceBody)
			console.log("Elisp code", elisp)
			const elispSource = elisp.emit(0)
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
	const compilerProcess = new Compiler(program.project);
	return compilerProcess.compile();
}
