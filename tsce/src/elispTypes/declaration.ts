import { Identifier } from ".";

export interface Declaration {
	matchesIdentifier(identifier: Identifier): boolean
}
