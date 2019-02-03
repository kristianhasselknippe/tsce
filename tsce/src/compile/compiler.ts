import { Project } from 'ts-simple-ast'
import chalk from 'chalk'
import * as IR from './ir'
import * as EL from './elispTypes'
import {
	extractCompilerDirectivesFromStrings,
	CompilerDirective,
	CompilerDirectiveKind
} from './elispTypes/compilerDirective';
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

class Compiler {
	constructor(readonly project: Project) { }

	compileIdentifier(identifier: IR.Identifier) {
		return new EL.Identifier(identifier.name)
	}

	compileFunctionDeclaration(functionDecl: IR.FunctionDeclaration) {
		const name = this.compileIdentifier(functionDecl.name)
		const args = functionDecl.args
			.map(this.compileIdentifier)
			.map(identifier => new EL.FunctionArg(identifier))
		const body = this.compileStatementList(functionDecl.body)
		return new EL.Defun(name, args, body)
	}

	compileStatementList(nodes: IR.Node[]): EL.Node[] {
		return nodes
			.map(x => this.compileNode(x))
			.filter(x => typeof x !== "undefined") as EL.Node[]
	}

	compileNode(node?: IR.Node): EL.Node | undefined {
		if (typeof node === 'undefined') {
			return
		}
		console.log("Compiling node: " + (node.constructor as any).name)
		switch (node.constructor) {
			case IR.Identifier:
				return this.compileIdentifier(<IR.Identifier>node)
			case IR.FunctionDeclaration:
				return this.compileFunctionDeclaration(<IR.FunctionDeclaration>node)
			case IR.VariableDeclaration:
			case IR.VariableDeclarationList:
			case IR.Assignment:
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
			case IR.NumberLiteral:
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
			case IR.SourceFile:
			default:
				//throw new Error("Unsupported IR type: " + ((node.constructor as any).name))
		}
	}

	generateElisp(ast: IR.SourceFile) {
		const statements = this.compileStatementList(ast.statements)
		return new EL.RootScope(statements)
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
