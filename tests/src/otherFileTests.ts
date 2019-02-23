import * as emacs from "emacs"
import { should, equal } from 'ert'

export function testFromAnotherFileUsingTheEmacsApi() {
	const foo = "bar"
	const l = emacs.length(foo)
	should(equal(l, 3))
	return true
}

export function testFromAnotherFileUsingTheEmacsApi2() {
	const foo = "bar"
	const l = emacs.length(foo)
	should(equal(l, 3))
	return true
}
