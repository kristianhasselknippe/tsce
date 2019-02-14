import { should, equal } from "ert";
import * as emacs from "emacs";
import * as otherFile from "./otherFileTests";


//[Form: ert-deftest]
function callingFunctionInOtherFile() {
  should(otherFile.testFromAnotherFileUsingTheEmacsApi());
}
