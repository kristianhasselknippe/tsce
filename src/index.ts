import * as ts from "typescript"
import * as fs from "fs"


let output = ""

let scope: ScopeType[] = []

enum ScopeType {
	Let
	Function
}

function emit(s: string) {
	output += s
}

function pushScope(st: ScopeType) {
	scope.push(st)
}

function popScope() {
	scope.pop()
}

function tabs() {
	let ret = ""
	for (let i = 0; i < scope.length; i++) {
		ret += "\t"
	}
	return ret
}

export function toElisp(sourceFile: ts.SourceFile) {
    toElispNode(sourceFile);

    function toElispNode(node: ts.Node) {
		//console.log(":: " + node.getText() + ", " + node.kind + ": " + ts.SyntaxKind[node.kind])
        switch (node.kind) {
		case ts.SyntaxKind.VariableStatement:
			let vs = (<ts.VariableStatement>node)
			let declarationList = vs.declarationList
			pushScope(ScopeType.Let)
			emit(tabs() + "(let (")
			let c = 0
			for (let variable of declarationList.declarations) {
				let name = variable.name.getText()
				emit(tabs() + `(${name} `)
				let type = variable.type
				let initializer = variable.initializer
				ts.forEachChild(node, toElispNode);
				emit(")")
				if (c < declarationList.declarations.length - 1) {
					emit("\n\t")
				}
				c++
			}
			break
		case ts.SyntaxKind.FunctionDeclaration:
			let fd = (<ts.FunctionDeclaration>node)
			let name = fd.name
			emit(tabs() + `(defun ${name.escapedText}`)
			pushScope(ScopeType.Function)

			

			ts.forEachChild(node, toElispNode)
			
			break
		case ts.SyntaxKind.StringLiteral:
			emit("\"" + (<ts.StringLiteral>node).text + "\"")
		case ts.SyntaxKind.FunctionDeclaration:
			break
		case ts.SyntaxKind.IfStatement:
			break
        }
		ts.forEachChild(node, toElispNode);
    }

    function report(node: ts.Node, message: string) {
        let { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        console.log(`${sourceFile.fileName} (${line + 1},${character + 1}): ${message}`);
    }
}

// Parse a file
let fileSource = fs.readFileSync("../../test.ts").toString()
let sourceFile = ts.createSourceFile("test.ts", fileSource, ts.ScriptTarget.ES2015, /*setParentNodes */ true);


toElisp(sourceFile);
console.log("Output")
console.log(output)
