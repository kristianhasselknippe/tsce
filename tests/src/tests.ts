import { should, equal } from 'ert'
import * as emacs from 'emacs'

interface TsceTestFunctionNamedArgumentsArg {
	foo: number
	bar: number
}

//[NamedArguments]
declare function tsceTestFunctionNamedArguments(arg: TsceTestFunctionNamedArgumentsArg): number

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

//[Form: ert-deftest]
function objectCreationWithListOfStrings() {
	const foo = {
		bar: ['hei', 'sann']
	}
	should(equal(foo.bar[0], 'hei'))
}

//[Form: ert-deftest]
function objectCreationWithListOfVariables() {
	const hei = 'hei'
	const sann = 'sann'
	const foo = {
		bar: [hei, sann]
	}
	should(equal(foo.bar[0], 'hei'))
}

//[Form: ert-deftest]
function objectLiteralReferencingMemberOfObject() {
	const foo = {
		bar: 'bartesting'
	}
	const bar = {
		testing: foo.bar
	}
	should(equal(bar.testing, 'bartesting'))
}

//[Form: ert-deftest]
function objectLiteralReferencingArrayInObject() {
	const foo = {
		bar: ['1','bartesting','2']
	}
	const bar = {
		testing: foo.bar[1]
	}
	should(equal(bar.testing, 'bartesting'))
}


function convert(str: string) {
	return 'foobar'
}

//[Form: ert-deftest]
function testQuotationOfNestedFunctionsInLetExpression() {
	let foo = {
		bar: convert('heisann')
	}
	should(equal(foo.bar, 'foobar'))
}

//[Form: ert-deftest]
function testQuotationOfPlusInObject() {
	let foo = {
		bar: 'heisann' + 123
	}
	should(equal(foo.bar, 'heisann123'))
}

//[Form: ert-deftest]
function testQuotationOfOperatorsInObject() {
	let foo = 120
	let foobar = {
		bar: foo++,
		baz: foo--,
		multi: foo * 2,
		div: foo / 2.0,
		sub: foo - 100
	}
	should(equal(foo, 120))
	should(equal(foobar.bar, 120))
	should(equal(foobar.baz, 121))
	should(equal(foobar.multi, 240))
	should(equal(foobar.div, 60))
	should(equal(foobar.sub, 20))
}

//[Form: ert-deftest]
function testObjectLiteralInObjectLiteral() {
	const foo = {
		bar: {
			hi: 'there'
		}
	}
	should(equal(foo.bar.hi, 'there'))
}

//[Form: ert-deftest]
function testEmptyObjectLiteral() {
	const foo = {}
	should(equal(foo, {}))
}

//[Form: ert-deftest]
function testNamedArgumentsFunction1() {
	const res = tsceTestFunctionNamedArguments({
		foo: 20,
		bar: 10
	})
	should(equal(res, 30))
}

//[Form: ert-deftest]
function testNamedArgumentsFunction2() {
	let arg = {
		foo: 20,
		bar: 10
	}
	const res = tsceTestFunctionNamedArguments(arg)
	should(equal(res, 30))
}

//[Form: ert-deftest]
function testNamedArgumentsFunction3() {
	let obj = {
		theFunc: tsceTestFunctionNamedArguments
	}
	let arg = {
		foo: 20,
		bar: 10
	}
	const res = obj.theFunc(arg)
	should(equal(res, 30))
}


//[Form: ert-deftest]
function testNamedArgumentsFunction4() {
	let obj = {
		theFunc: tsceTestFunctionNamedArguments
	}
	const res = obj.theFunc({
		foo: 20,
		bar: 10
	})
	should(equal(res, 30))
}

//[Form: ert-deftest]
function nullTest() {
	const n = null
	should(equal(n, null))
}

//[Form: ert-deftest]
function testEmacsVersion() {
	const v = emacs.emacsVersion
	should(!emacs.versionLessThan(v, "24.0"))
}

//[Form: ert-deftest]
function testStringEquality() {
	const foo = "hei"
	const bar = "hei"
	should(foo === bar)
}

//[Form: ert-deftest]
function plusplusTest() {
	let item = 1
	should(equal(item++, 1))
	should(equal(item, 2))
}

//[Form: ert-deftest]
function forOfTest() {
	const items = [1,2,3,4]
	let counter = 0
	for (const item of items) {
		should(equal(item, items[counter++]))
	}
}

//[Form: ert-deftest]
function forOfTest2() {
	const items = [{name: 'one'},{name: 'two'},{name: 'three'}]
	let counter = 0
	for (const item of items) {
		should(equal(item.name, items[counter++].name))
	}
}
