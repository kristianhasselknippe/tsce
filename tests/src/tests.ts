import { should, equal } from "ert";
import * as emacs from "emacs";
import * as otherFile from "./otherFileTests";

interface TsceTestFunctionNamedArgumentsArg {
  foo: number;
  bar: number;
}

//[NamedArguments]
declare function tsceTestFunctionNamedArguments(
  arg: TsceTestFunctionNamedArgumentsArg
): number;

//[Form: ert-deftest]
function testEquality() {
  should(equal("a", "a"));
}

//[Form: ert-deftest]
function testStringConcat() {
  const a = "a";
  const b = "b";
  const ab = a + b;
  should(equal(ab, "ab"));
}

//[Form: ert-deftest]
function testObjectCreation() {
  const obj = {
    a: "aaa",
    b: "bbb"
  };
  should(equal(obj.a, "aaa"));
  should(equal(obj.b, "bbb"));
}

//[Form: ert-deftest]
function testArrayCreation() {
  const arrTig = [1, 2, 3, 4, 5];
  should(equal(arrTig[0], 1));
  should(equal(arrTig[1], 2));
  should(equal(arrTig[2], 3));
  should(equal(arrTig[3], 4));
  should(equal(arrTig[4], 5));
}

//[Form: ert-deftest]
function arrayAssignment() {
  const arr = [1, 2, 3, 4, 5];
  arr[2] = 1000;
  should(equal(arr[2], 1000));
}

//[Form: ert-deftest]
function shortHandObjectNotation() {
  const foo = "bar";
  const baz = {
    foo
  };
  should(equal(baz.foo, "bar"));
}

//[Form: ert-deftest]
function objectItemAssignmentEmptyObj() {
  let baz321: any = {};
  baz321.foo = "bar";
  should(equal(baz321.foo, "bar"));
}

//[Form: ert-deftest]
function objectItemAssignmentEmptyObjUsingIndexer() {
  let baz123: any = {};
  baz123["foo"] = "bar";
  should(equal(baz123["foo"], "bar"));
}

//[Form: ert-deftest]
function objectItemAssignment() {
  let baz = {
    foo: "test"
  };
  should(equal(baz.foo, "test"));
  baz.foo = "bar";
  should(equal(baz.foo, "bar"));
}

//[Form: ert-deftest]
function objectItemAssignmentNested() {
  let baz = {
    foo: {
      test: "test"
    }
  };
  should(equal(baz.foo.test, "test"));
  baz.foo.test = "bar";
  should(equal(baz.foo.test, "bar"));
}

//[Form: ert-deftest]
function objectNotationWithArrowFunction() {
  const baz = {
    foo: () => "bar"
  };
  should(equal(baz.foo(), "bar"));
}

//[Form: ert-deftest]
function objectNotationWithFunction() {
  function foo() {
    return "bar";
  }
  const baz = {
    foo: foo
  };
  should(equal(baz.foo(), "bar"));
}

//[Form: ert-deftest]
function shortHandObjectNotationWithFunction() {
  function foo() {
    return "bar";
  }
  const baz = {
    foo
  };
  should(equal(baz.foo(), "bar"));
}

//[Form: ert-deftest]
function listOfVariables() {
  const foo = "foo";
  const bar = "bar";
  const list = [foo, bar];
  should(equal(list[0], "foo"));
  should(equal(list[1], "bar"));
}

//[Form: ert-deftest]
function callingFunctionFromLambda() {
  let test = "test";
  function tester() {
    return true;
  }
  let more = "more";
  const foo = {
    tester: () => tester()
  };
  should(foo.tester());
}

//[Form: ert-deftest]
function callingArrowFunctionFromLambda() {
  let test = "test";
  const tester1 = () => {
    return true;
  };
  let more = "more";
  const foo = {
    tester2: () => tester1()
  };
  should(foo.tester2());
}

const foo1337bar = "bar";
//[Form: ert-deftest]
function testTopLevelVariable() {
  should(equal(foo1337bar, "bar"));
}

//[Form: ert-deftest]
function inlineFunctionTest() {
  function foo() {
    return "hei";
  }
  should(equal(foo(), "hei"));
}

//[Form: ert-deftest]
function callInlineFunctionThroughObjectRefTest() {
  let val = 20;
  function foobar(v: number) {
    return v > 10;
  }
  const theObj = {
    foo: foobar
  };
  should(theObj.foo(val));
}

function rootFunction(foo: number) {
  return foo > 10;
}

//[Form: ert-deftest]
function callRootFunctionThroughObjectRefTest() {
  let val = 20;
  const theObj = {
    root: rootFunction
  };
  should(theObj.root(val));
}

//[Form: ert-deftest]
function stringsAndStringAccess() {
  const fooString = "heisann";
  should(equal(fooString[0], "h"));
  should(equal(fooString[1], "e"));
  should(equal(fooString[2], "i"));
}

//[Form: ert-deftest]
function objectCreationWithListOfStrings() {
  const foo = {
    bar: ["hei", "sann"]
  };
  should(equal(foo.bar[0], "hei"));
}

//[Form: ert-deftest]
function objectCreationWithListOfVariables() {
  const hei = "hei";
  const sann = "sann";
  const foo = {
    bar: [hei, sann]
  };
  should(equal(foo.bar[0], "hei"));
}

//[Form: ert-deftest]
function objectLiteralReferencingMemberOfObject() {
  const foo = {
    bar: "bartesting"
  };
  const bar = {
    testing: foo.bar
  };
  should(equal(bar.testing, "bartesting"));
}

//[Form: ert-deftest]
function objectLiteralReferencingArrayInObject() {
  const foo = {
    bar: ["1", "bartesting", "2"]
  };
  const bar = {
    testing: foo.bar[1]
  };
  should(equal(bar.testing, "bartesting"));
}

function convert(str: string) {
  return "foobar";
}

//[Form: ert-deftest]
function testQuotationOfNestedFunctionsInLetExpression() {
  let foo = {
    bar: convert("heisann")
  };
  should(equal(foo.bar, "foobar"));
}

//[Form: ert-deftest]
function testQuotationOfPlusInObject() {
  let foo = {
    bar: "heisann" + 123
  };
  should(equal(foo.bar, "heisann123"));
}

//[Form: ert-deftest]
function testQuotationOfOperatorsInObject() {
  let foo = 120;
  let foobar = {
    bar: foo++,
    baz: foo--,
    multi: foo * 2,
    div: foo / 2.0,
    sub: foo - 100
  };
  should(equal(foo, 120));
  should(equal(foobar.bar, 120));
  should(equal(foobar.baz, 121));
  should(equal(foobar.multi, 240));
  should(equal(foobar.div, 60.0));
  should(equal(foobar.sub, 20));
}

//[Form: ert-deftest]
function testObjectLiteralInObjectLiteral() {
  const foo = {
    bar: {
      hi: "there"
    }
  };
  should(equal(foo.bar.hi, "there"));
}

//[Form: ert-deftest]
function testEmptyObjectLiteral() {
  const foo = {};
  should(equal(foo, {}));
}

//[Form: ert-deftest]
function testNamedArgumentsFunction1() {
  const res = tsceTestFunctionNamedArguments({
    foo: 20,
    bar: 10
  });
  should(equal(res, 30));
}

//[Form: ert-deftest]
function testNamedArgumentsFunction2() {
  let arg = {
    foo: 20,
    bar: 10
  };
  const res = tsceTestFunctionNamedArguments(arg);
  should(equal(res, 30));
}

//[Form: ert-deftest]
function testNamedArgumentsFunction3() {
  let obj = {
    theFunc: tsceTestFunctionNamedArguments
  };
  let arg = {
    foo: 20,
    bar: 10
  };
  const res = obj.theFunc(arg);
  should(equal(res, 30));
}

//[Form: ert-deftest]
function testNamedArgumentsFunction4() {
  let obj = {
    theFunc: tsceTestFunctionNamedArguments
  };
  const res = obj.theFunc({
    foo: 20,
    bar: 10
  });
  should(equal(res, 30));
}

//[Form: ert-deftest]
function nullTest() {
  const n = null;
  should(equal(n, null));
}

//[Form: ert-deftest]
function testEmacsVersion() {
  const v = emacs.emacsVersion;
  should(!emacs.versionLessThan(v, "24.0"));
}

//[Form: ert-deftest]
function testStringEquality() {
  const foo = "hei";
  const bar = "hei";
  should(foo === bar);
}

//[Form: ert-deftest]
function plusplusTest() {
  let item = 1;
  should(equal(item++, 1));
  should(equal(item, 2));
}

//[Form: ert-deftest]
function forOfTest() {
  const items = [1, 2, 3, 4];
  let counter = 0;
  for (const item of items) {
    should(equal(item, items[counter++]));
  }
}

//[Form: ert-deftest]
function forOfTest2() {
  const items = [{ name: "one" }, { name: "two" }, { name: "three" }];
  let counter = 0;
  for (const item of items) {
    should(equal(item.name, items[counter++].name));
  }
}

//[Form: ert-deftest]
function forLoopTestWithMoreAfter() {
  const items = [0, 1, 2, 3];
  let counter = 0;
  let foo = 0;
  for (let i = 0; i < 4; i++) {
    should(equal(i, items[i]));
  }

  foo++;
  should(equal(foo, 1));
}

//[Form: ert-deftest]
function forOfTestWithMoreAfter() {
  const items = [1, 2, 3, 4];
  let counter = 0;
  let foo = 0;
  for (const item of items) {
    should(equal(item, items[counter++]));
  }

  foo++;
  should(equal(foo, 1));
}

//[Form: ert-deftest]
function ifElseTest1() {
  let foo;
  if (true) {
    foo = true;
  } else {
    foo = false;
  }
  should(foo);
}

//[Form: ert-deftest]
function ifElseIfTest2() {
  let bar = false;
  let foo = true;
  if (false) {
  } else if (true) {
    if (false) {
    } else if (true) {
      bar = true;
      foo = true;
      if (false) {
      } else if (false) {
        foo = false;
      }
    }
  }

  should(bar);
  should(foo);
}

//[Form: ert-deftest]
function ifElseIfTest3() {
  let foo;
  if (false) {
    foo = false;
  } else {
    foo = true;
  }
  should(foo);
}

interface Foo {
  foo: string;
}

interface Bar {
  bar: string;
}

type FooBar = Foo | Bar;

function createFooBar(): FooBar {
  return { foo: "testing" };
}

//[Form: ert-deftest]
function typeAssertions() {
  const foo = createFooBar();
  if ((<Bar>foo).bar) {
    should(false);
  } else if ((<Foo>foo).foo) {
    should(true);
  } else {
    should(false);
  }
}

//[Form: ert-deftest]
function insertIntoMap() {
  let foo: any = {};
  foo.bar = 123;
  should(equal(foo.bar, 123));
}

//[Form: ert-deftest]
function insertIntoMapIndexed() {
  let foo: any = {};
  foo["bar"] = 123;
  should(equal(foo.bar, 123));
}

//[Form: ert-deftest]
function insertIntoMapByPropertyAndIndexed() {
  let foo: any = {};
  foo["bar"] = 123;
  foo.foo = 125;
  should(equal(foo.bar, 123));
  should(equal(foo["foo"], 125));
}

//[Form: ert-deftest]
function insertIntoEmptyObjAndCall() {
  let foo = 0 + "";
  let items: { [index: string]: any } = {};
  items[foo + ""] = (arg: boolean) => {
    should(arg);
  };

  items[foo](true);
}

let responseHandlers: any = {};
function callTheResponseHandler(foo: string) {
  responseHandlers[foo](foo);
}

//[Form: ert-deftest]
function lambdaInsertionTest() {
  let idCounter = 0;
  const id = idCounter++ + "";
  responseHandlers[id] = (foo: any) => {
    should(equal(id, "0"));
    should(equal(id, foo));
  };
  responseHandlers[id](id);
}

//[Form: ert-deftest]
function deleteProperty() {
  let foo: any = {};
  should(!foo.bar);
  foo.bar = "foobar";
  should(equal(foo.bar, "foobar"));
  delete foo.bar;
  should(!foo.bar);
}

//[Form: ert-deftest]
function deletePropertyUsingIndexer() {
  let foo: any = {};
  should(!foo.bar);
  foo["bar"] = "foobar";
  should(equal(foo.bar, "foobar"));
  delete foo["bar"];
  should(!foo.bar);
}

//[Form: ert-deftest]
function deletePropertyUsingComputedIndexer() {
  const bar = "bar";
  let foo: any = {};
  should(!foo[bar]);
  foo[bar] = "foobar";
  should(equal(foo.bar, "foobar"));
  delete foo[bar];
  should(!foo.bar);
}

//[Form: ert-deftest]
function deletePropertyTwoLevels() {
  let foo: any = { bar: {} };
  should(!foo.bar.baz);
  foo.bar.baz = "foobar";
  should(equal(foo.bar.baz, "foobar"));
  delete foo.bar.baz;
  should(!foo.bar.baz);
}

//[Form: ert-deftest]
function deletePropertyTwoLevelsIndexer() {
  let foo: any = { bar: {} };
  should(!foo.bar["baz"]);
  foo.bar["baz"] = "foobar";
  should(equal(foo.bar["baz"], "foobar"));
  delete foo.bar["baz"];
  should(!foo.bar["baz"]);
}

//[Form: ert-deftest]
function testIfElseWithMoreThanOneItemInBody() {
  let theAssert = false;
  if (true) {
    theAssert = false;
    theAssert = true;
  } else {
    theAssert = false;
  }

  should(theAssert);
}

let handlersList: any = {};
function testLexicalArgument(bar: (arg: boolean) => void, arg: boolean) {
	handlersList.later = () => {
		bar(arg);
	};
}

//[Form: ert-deftest]
function lexicalScopingOverFunctionArguments() {
  let foo = false;
  testLexicalArgument((arg: boolean) => {
    foo = arg;
  }, true);
  should(!foo);
  handlersList.later();
  should(foo);
}

enum TestEnum {
  Var1,
  Var2
}

//[Form: ert-deftest]
function enumTest1() {
  const foo = TestEnum.Var1;
  should(equal(foo, TestEnum.Var1));
  should(!equal(foo, TestEnum.Var2));
}

enum TestEnum2 {
  "Var1",
  Var2 = 1
}

//[Form: ert-deftest]
function enumTest2() {
  const foo = TestEnum2.Var1;
  should(equal(foo, TestEnum2.Var1));
  should(!equal(foo, TestEnum2.Var2));
}

//[Form: ert-deftest]
function enumTest3() {
  const foo = TestEnum2.Var2;
  should(equal(foo, TestEnum2.Var2));
  should(!equal(foo, TestEnum2.Var1));
}

//[Form: ert-deftest]
function callingFunctionInOtherFile() {
  should(otherFile.testFromAnotherFileUsingTheEmacsApi());
}

//[Form: ert-deftest]
function plusEquals() {
	let foo = 0
	foo += 5
	should(equal(foo, 5))
}

//[Form: ert-deftest]
function plusMinus() {
	let foo = 16
	foo -= 15
	should(equal(foo, 1))
}

//[Form: ert-deftest]
function plusMul() {
	let foo = 3
	foo *= 3
	should(equal(foo, 9))
}

//[Form: ert-deftest]
function plusDiv() {
	let foo = 12
	foo /= 2
	should(equal(foo, 6))
}

//[Form: ert-deftest]
function prefixMinusOperator() {
	let foo = 10 - 12
	should(equal(foo, -2))
}

//[Form: ert-deftest]
function prefixNotOperator() {
	let foo = false
	should(!foo)
}

//[Form: ert-deftest]
function ternaryOperatorFirstCase() {
	const test = 10
	let foo = test > 5 ? "hei" : "sann"
	should(equal(foo, "hei"))
}

//[Form: ert-deftest]
function ternaryOperatorSecondCase() {
	const test = 4
	let foo = test > 5 ? "hei" : "sann"
	should(equal(foo, "sann"))
}
