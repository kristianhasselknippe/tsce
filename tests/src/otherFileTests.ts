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

export const testVariable = 123123


interface TsceTestFunctionNamedArgumentsArg {
  foo: number;
  bar: number;
}

//[NamedArguments]
//[Name: tsce-test-function-named-arguments]
export declare function tsceTestFunctionNamedArguments(
  arg: TsceTestFunctionNamedArgumentsArg
): number;
