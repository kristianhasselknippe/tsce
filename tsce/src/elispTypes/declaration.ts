import { Identifier } from ".";

export interface Declaration {
	isDeclaration(): this is Declaration
	matchesIdentifier(identifierName: string): boolean
}
