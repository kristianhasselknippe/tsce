import { Identifier, Node } from ".";

export interface Declaration {
	isDeclaration(): this is Declaration
	matchesIdentifier(identifierName: string): boolean
}

export interface DeclarationsSource {
	isDeclarationsSource(): this is DeclarationsSource
	getDeclarations(): (Node & Declaration)[]
}
