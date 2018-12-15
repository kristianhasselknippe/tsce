export enum SymbolType {
	Function,
	Variable
}

export interface Symbol {
	name: string,
	type: SymbolType
}

export class Context {
	private symbols: Symbol[] = []

	addSymbol(sym: Symbol) {
		this.symbols.push(sym)
	}

	getSymbolForName(name: string) {
		for (let i = this.symbols.length - 1; i >= 0; i--) {
			const sym = this.symbols[i]
			if (sym.name === name) {
				return sym
			}
		}
		return {
			name: "<missing>",
			type: SymbolType.Function
		}
	}
}
