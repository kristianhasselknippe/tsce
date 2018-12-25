import {
  TS,
  message,
  tslog,
  tsarray,
  getBufferCreate,
  insertBufferSubstringNoProperties,
  setBuffer,
  withCurrentBuffer,
  insert,
  doWithCurrentBuffer,
  pointMax,
  stringp
} from "ts-lib";

function assignmentAndLoops(to: number) {
  let foo = 1 + 2;
  for (let i = 0; i < to; i++) {
    foo = foo + 1;
    message("heisann: " + foo);
  }
  return foo;
}

assignmentAndLoops(123);

function objectCreation() {
  var heisann = "ok";
  const foo = {
    hei: "foobar",
    heisann,
    foo: 123,
    bar: {
      testing: "heiheihei"
    }
  };
  return foo.bar.testing;
}

objectCreation();

function lambdas() {
  const foo = {
    doIt: (foobar: any, bar: any) => {
      return foobar + bar;
    }
  };

  return foo.doIt("hei", "sann");
}

lambdas();

function operators() {
  const foo = 1 + 2;
  tslog(foo);
  const bar = 2 + "heisann";
  tslog(bar);
  const tull = "ball " + "ok da";
  tslog(tull);
  const heisann = "testing " + 1 + "heisann";
  tslog(heisann);
}

operators();

function arrays() {
  let foo = [];
  let bar = [1, 2, 3, 4];
  return bar[3];
}

arrays();

function classTest() {
  let test = {
    length: () => {
      tslog("Testing it");
    },
    items: [1, 2, 3]
  };

  test.length();
  return test.items;
}

classTest();

function bar1(index: number) {
  return index;
}

bar1(20);

function foo1() {
  const ret = "hei";
  return ret;
}

foo1();

function arraysAndStuff1() {
  var items = tsarray([1, 2, 3]);
  items.push(4);
  items.push(5);
  items.push(6);
  items.push(7);
  return items.length();
}

arraysAndStuff1();

function arraysAndStuff2() {
  var items = tsarray([1, 2, 3, 4, 5, 6]);
  const foo = items.length();

  tslog(foo);

  return items.get(4);
}

arraysAndStuff2();

function workingWithBuffers() {
  let foo = getBufferCreate("a cool buffer");

  doWithCurrentBuffer(foo, () => {
    tslog("Foooooooooooobar");
    insert("dette er en test");
    tslog("Point max " + pointMax());
  });

  return foo;
}

//[Form: ert-deftest]
function testSomething() {
  p;
  const foo = {
    hei: tsarray([1, 2, 3]),
    ok: {
      bar: {
        kult: () => {
          message("foobar it worked");
        }
      }
    }
  };
  foo.ok.bar.kult();
  return foo.hei.length() + "";
}

function testArrayLoop() {
  const foo = tsarray(["hei", "hvordan", "har", "du", "det?"]);
  for (let i = 0; i < foo.length(); i++) {
    tslog(foo.get(i));
  }
}

testArrayLoop();

//[Name: +-+-+=>]
function customFunctionNameThroughCommentDirective() {}

//[Predicate]
function predicatedFunctionUsingCompilerDirective() {}

//[Form: defvar]
function otherFormThanFunction() {}

function enBug() {
  let listeMedNoe = tsarray([1, 2, 3, 4, 5, 6]);
  for (let i = 0; i < listeMedNoe.length(); i++) {
    const tallet = listeMedNoe.get(i);
    tslog("Tallet til mamma: " + tallet * tallet);
  }
}

enBug();

function heiMammaOgPappa() {
  let listeMedNoe = tsarray([1, 2, 3, 4, 5, 6]);
  for (let i = 0; i < listeMedNoe.length(); i++) {
    const tallet = listeMedNoe.get(i);
    const ret = tallet * tallet;
    tslog("Tallet til mamma: " + ret);
  }
}

heiMammaOgPappa();

function square(a: number) {
  return a * a;
}

tslog(square(square(4)));

function insertTextNew(someText: string) {
  insert(someText);
}

stringp("foobar");
