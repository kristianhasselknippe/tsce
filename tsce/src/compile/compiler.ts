import { Project } from 'ts-simple-ast'
import chalk from 'chalk'
import * as IR from './ir'
import * as EL from './elispTypes'
import { TsceProject } from './projectFormat';
import { Parser } from './parser';


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

class ScopeStack<T> {
	private items: T[] = []

	constructor(readonly scope: T & Addable<T>) { }

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

	push(item: T) {
		this.lastScopeStack.push(item)
	}

	pushScope<TScope extends (T & Addable<T>)>(scope: TScope): ScopeStack<T> {
		const scopeStack = new ScopeStack(scope)
		this.stack.push(scopeStack)
		return scopeStack
	}

	resolveTo(scope: ScopeStack<T>) {
		while (this.lastScopeStack !== scope) {
			this.lastScopeStack.resolve()
			const lastScope = this.stack.pop()!.scope
			this.lastScopeStack.push(lastScope)
		}
	}

	getParentScopeOf(scope: ScopeStack<T>) {
		for (let i = 0; i < this.stack.length; i++) {
			if (this.stack[i] === scope) {
				if (i === 0) {
					throw "Tried to return parent scope of root scope"
				}
				return this.stack[i-1]
			}
		}
		throw "Could not find parent scope of: " + JSON.stringify(scope)
	}

	print() {
		console.log("STACK: ", this.stack)
	}

	resolveToParentOf(scope: ScopeStack<T>) {
		const parent = this.getParentScopeOf(scope)
		this.resolveTo(parent)
	}
}

class Compiler {
	constructor(readonly project: Project) { }

	context = new Stack()

	compileAndExpect<TOut>(node: IR.Node): TOut
	compileAndExpect<TOut>(node: IR.Node | undefined): TOut | undefined
	compileAndExpect<TOut>(node: IR.Node | undefined) {
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
		this.context.pushScope(new EL.SourceFile())
		this.compileNodeList(sourceFile.statements)
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

	compileNode(node?: IR.Node) {
		if (typeof node === 'undefined') {
			return
		}
		console.log("Compiling node: " + (node.constructor as any).name)
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
			case IR.UnaryPrefix:
			case IR.UnaryPostfix:
			case IR.DeleteExpression:
			case IR.EnumMember:
			case IR.EnumDeclaration:
			case IR.ArrayLiteral:
			case IR.ElementAccess:
			case IR.PropertyAccess:
			case IR.ObjectProperty:
			case IR.ObjectLiteral:
			case IR.StringLiteral:
				this.compileStringLiteral(<IR.StringLiteral>node)
				break
			case IR.NumberLiteral:
				this.compileNumberLiteral(<IR.NumberLiteral>node)
				break
			case IR.BooleanLiteral:
			case IR.Block:
			case IR.CallExpression:
			case IR.If:
			case IR.For:
			case IR.ForOf:
			case IR.ForIn:
			case IR.While:
			case IR.ArrowFunction:
			case IR.ReturnStatement:
			case IR.NamedImport:
			case IR.NamespaceImport:
			case IR.ModuleDeclaration:
			case IR.Null:
			default:
				//throw new Error("Unsupported IR type: " + ((node.constructor as any).name))
				return -1
		}
	}

	generateElisp(ast: IR.SourceFile) {
		this.compileNode(ast)
		return this.context.pop() as EL.SourceFile
	}

	compile(): CompilationResult[] {
		const parser = new Parser()
		const ret: CompilationResult[] = [];
		for (const sourceFile of this.project.getSourceFiles()) {
			console.log(chalk.blueBright('    - Compiling file: ') + sourceFile.getFilePath())
			//TODO: Add ts-lib.el import to top
			const sourceBody = parser.parseFile(sourceFile)
			const elisp = this.generateElisp(sourceBody)
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
