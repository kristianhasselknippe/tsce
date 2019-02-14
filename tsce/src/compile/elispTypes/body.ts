import { Scope, tabs } from ".";

//TODO: Body shouldn't be a scope. It is just an array of statements
export class Body extends Scope {
	type: string = 'Body'
	constructor() {
		super()
	}
}
