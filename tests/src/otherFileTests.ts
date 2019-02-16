import * as emacs from "emacs"
import { should, equal } from 'ert'


export function testEverything() {
	let foo = 10
	let bar = 20
	const test = bar + foo
	const test2 = "foo"

	if (test > 29) {
		bar = 123
	} else {
		foo = 321
	}

	return foo

}
