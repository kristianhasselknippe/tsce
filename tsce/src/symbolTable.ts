import { Node } from 'ts-simple-ast'

export enum SymbolType {
	Function,
	Variable,
	Lambda,
	NamespaceImport
}

export interface Symbol {
	type: SymbolType;
}

class Symbols {
	private symbols: { [nodeId: string]: Symbol } = {};

	getSymbolForNode(node: Node) {
		const nodeId = getIdForNode(node)
		return this.symbols[nodeId]
	}

	addSymbolForNode(node: Node, symbol: Symbol) {
		const nodeId = getIdForNode(node)
		this.symbols[nodeId] = symbol
	}
}

export class SymbolTable {
	private symbols: { [file: string]: Symbols } = {}
	
	private getSymbolsForFileOfNode(node: Node) {
		const fileName = node.getSourceFile().getFilePath()
		if (typeof this.symbols[fileName] === 'undefined') {
			this.symbols[fileName] = new Symbols()
		}
		return this.symbols[fileName]
	}

	getSymbolForNode(node: Node) {
		const symbols = this.getSymbolsForFileOfNode(node)
		return symbols.getSymbolForNode(node)
	}
	
	push(node: Node, symbolType: SymbolType) {
		const symbols = this.getSymbolsForFileOfNode(node)
		symbols.addSymbolForNode(node, {
			type: symbolType
		})
	}
}
