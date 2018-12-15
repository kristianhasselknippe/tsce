import { Lambda, Identifier, Scope, Block } from './'

export abstract class Node {
	abstract type: string
	abstract emit(indent: number): string

	isBig() {
		return false
	}

	isLambda(): this is Lambda {
		return this.type === 'Lambda'
	}

	isIdentifier(): this is Identifier {
		return this.type === 'Identifier'
	}

	isScope(): this is Scope {
		return false
	}

	isBlock(): this is Block {
		return false
	}
}
