import { should, equal } from 'ert'
import * as emacs from 'emacs'

//[Form: ert-deftest]
function testEquality(){
	should(equal('a', 'a'))
}

//[Form: ert-deftest]
function testStringConcat(){
	const a = 'a'
	const b = 'b'
	const ab = a + b
	should(equal(ab, 'ab'))
}

//[Form: ert-deftest]
function testObjectCreation(){
	const obj = {
		a: 'aaa',
		b: 'bbb'
	}
	should(equal(obj.a, 'aaa'))
	should(equal(obj.b, 'bbb'))
}

//[Form: ert-deftest]
function testArrayCreation(){
	const arr = [1,2,3,4,5]
	should(equal(arr[0], 1))
	should(equal(arr[1], 2))
	should(equal(arr[2], 3))
	should(equal(arr[3], 4))
	should(equal(arr[4], 5))
}

//[Form: ert-deftest]
function shortHandObjectNotation(){
	const foo = 'bar'
	const baz = {
		foo
	}
	should(equal(baz.foo, 'bar'))
}

//[Form: ert-deftest]
function objectNotationWithArrowFunction(){
	const baz = {
		foo: () => 'bar'
	}
	should(equal(baz.foo(), 'bar'))
}

//[Form: ert-deftest]
function objectNotationWithFunction(){
	function foo() {
		return 'bar'
	}
	const baz = {
		foo: foo
	}
	should(equal(baz.foo(), 'bar'))
}

//[Form: ert-deftest]
function shortHandObjectNotationWithFunction(){
	function foo() {
		return 'bar'
	}
	const baz = {
		foo
	}
	should(equal(baz.foo(), 'bar'))
}

//[Form: ert-deftest]
function listOfVariables(){
	const foo = 'foo'
	const bar = 'bar'
	const list = [foo, bar]
	should(equal(list[0], 'foo'))
	should(equal(list[1], 'bar'))
}

//[Form: ert-deftest]
function callingFunctionFromLambda(){
	let test = 'test'
	function tester(){
		return true
	}
	let more = 'more'
	const foo = {
		tester: () => tester()
	}
	should(foo.tester())
}

//[Form: ert-deftest]
function callingArrowFunctionFromLambda(){
	let test = 'test'
	const tester = () => {
		return true
	}
	let more = 'more'
	const foo = {
		tester: () => tester()
	}
	should(foo.tester())
}

const foo = 'bar'
//[Form: ert-deftest]
function testTopLevelVariable(){
	should(equal(foo, 'bar'))
}

//[Form: ert-deftest]
function inlineFunctionTest() {
	function foo() {
		return 'hei'
	}
	should(equal(foo(), 'hei'))
}

//[Form: ert-deftest]
function callInlineFunctionThroughObjectRefTest() {
	let val = 20
	function foobar(v: number) {
		return v > 10
	}
	const theObj = {
		foo: foobar
	}
	should(theObj.foo(val))
}

function rootFunction(foo: number) {
	return foo > 10
}

//[Form: ert-deftest]
function callRootFunctionThroughObjectRefTest() {
	let val = 20
	const theObj = {
		root: rootFunction
	}
	should(theObj.root(val))
}
