import { Identifier } from ".";

export interface Declaration {
	matchesIdentifierName(identifier: string): boolean
}
