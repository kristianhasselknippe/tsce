declare module "s" {
  function sTrim(s: string): string;
  function sTrimLeft(s: string): string;
  function sTrimRight(s: string): string;
  function sChomp(s: string): string;
  function sCollapseWhitespace(s: string): string;
  function sWordWrap(len: number, s: string): string;
  function sCenter(len: number, s: string): string;
  function sPadLeft(len: number, padding: number, s: string): string;
  function sPadRight(len: number, padding: number, s: string): string;

  //To shorter string
  function sTruncate(len: number, s: string): string;
  function sLeft(len: number, s: string): string;
  function sRight(len: number, s: string): string;
  function sChopSuffix(suffix: string, s: string): string;
  function sChopSuffixes(suffix: string, s: string): string;
  function sChopPrefix(prefix: string, s: string): string;
  function sChopPrefixes(prefixes: string, s: string): string;
  function sSharedStart(s1: string, s2: string): string;
  function sSharedEnd(s1: string, s2: string): string;

  //To longer string
  function sRepeat(num: number, s: string): string;
  function sConcat(...strings: string[]): string;
  function sPrepend(prefix: string, s: string): string;
  function sAppend(suffix: string, s: string): string;

  //To and from lists
  function sLines(s: string): string;
  function sMatch(regexp: string, s: string, start?: number): string;
  function sMatchStringsAll(regex: string): string;
  function sMatchedPositionsAll(regexp: string, subexpDepth?: number): string;
  function sSliceAt(regexp: string, s: string): string;
  function sSplit(separator: string, s: string, omitNulls?: number): string;
  function sSplitUpTo(
    separator: string,
    s: string,
    n: string,
    omitNulls?: number
  ): string[];
  function sJoin(separator: string, strings: string[]);

  //Predicates
  //function sEquals?(s1 s2)
  //function sLess? (s1 s2)
  //function sMatches? (regexp s &optional start)
  //function sBlank? (s: string)
  //function sPresent? (s: string)
  //function sEndsWith? (suffix: string s &optional ignore-case)
  //function sStartsWith? (prefix s &optional ignore-case)
  //function sContains? (needle s &optional ignore-case)
  //function sLowercase? (s: string)
  //function sUppercase? (s: string)
  //function sMixedcase? (s: string)
  //function sCapitalized? (s: string)
  //function sNumeric? (s: string)

  //The misc bucket
  //function sReplace(old: string, new: string, s: string): string
  //function sReplaceAll(replacements s)
  function sDowncase(s: string): string;
  function sUpcase(s: string): string;
  function sCapitalize(s: string): string;
  function sTitleize(s: string): string;
  //function sWith (s form &rest more)
  function sIndexOf(needle: string, s: string, ignoreCase: boolean): number;
  function sReverse(s: string): string;
  function sPresence(s: string): boolean;
  //function sFormat (template replacer &optional extra)
  //function sLexFormat (format-str)
  //function sCountMatches (regexp s &optional start end)
  //function sWrap (s prefix &optional suffix: string)

  // Pertaining to words
  //function sSplitWords (s: string)
  //function sLowerCamelCase (s: string)
  //function sUpperCamelCase (s: string)
  //function sSnakeCase (s: string)
  //function sDashedWords (s: string)
  //function sCapitalizedWords (s: string)
  //function sTitleizedWords (s: string)
  //function sWordInitials (s: string)
}
