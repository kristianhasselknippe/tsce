declare module 'emacs' {
	const TS: {
		consolelog: (msg: string | number) => void
		len: <T>(array: T[]) => number
	}

	function message(msg: string): void
	function tslog(msg: string | number): void

	interface ElispArray<T> {
		get(index: number): T
		forEach<TOut>(mapper: (input: T) => TOut): ElispArray<TOut>
		push(item: T): void
		pop(): T
		length(): number
	}

	function tsarray<T>(items: T[]): ElispArray<T>

	function doWithCurrentBuffer(buffer: Buffer, action: () => void): void

	// Buffers
	interface Buffer {}

	type BufferOrName = string | Buffer

	function getBufferCreate(name: string): Buffer
	function currentBuffer(): Buffer
	/** This function makes buffer-or-name the current buffer. buffer-or-name must be an existing buffer or the name of an existing buffer. The return value is the buffer made current.

		This function does not display the buffer in any window, so the user cannot necessarily see the buffer. But Lisp programs will now operate on it. */
	function setBuffer(bufferOrName: BufferOrName): void

	function withCurrentBuffer(bufferOrName: BufferOrName, body: any): void
	function withTempBuffer(body: any): void
	function saveExcursion(body: any): void

	// Text
	function insert(...args: string[]): void
	function insertBeforeMarkers(...args: string[]): void
	function insertChar(char: string, count?: number): void
	function insertBufferSubstring(bufferOrName: string | Buffer, start?: number, end?: number): void
	function insertBufferSubstringNoProperties(bufferOrName: string | Buffer, start?: number, end?: number): void

	// Positions
	/** This function returns the value of point in the current buffer, as an integer. */
	function point(): number
	/** This function returns the minimum accessible value of point in the current buffer. This is normally 1, but if narrowing is in effect, it is the position of the start of the region that you narrowed to. */
	function pointMin(): number
	/** This function returns the maximum accessible value of point in the current buffer. This is (1+ (buffer-size)), unless narrowing is in effect, in which case it is the position of the end of the region that you narrowed to. */
	function pointMax(): number

	function bufferSize(buffer?: Buffer): number

	// Motion by char
	function gotoChar(position: number): void
	function forwardChar(count?: number): void
	function backwardChar(count?: number): void

	// Motion by word
	function forwardWord(count?: number): void
	function backwardWord(count?: number): void

	// Motion by buffer
	function beginningOfBuffer(n?: number): void
	function endOfBuffer(n?: number): void

	// Motion by line
	function beginningOfLine(count?: number): void
	function lineBeginningPosition(count?: number): number

	function endOfLine(count?: number): void
	function lineEndPosition(count?: number): void

	function forwardLine(count?: number): void

	function countLines(start: number, end: number): void
	function countWords(start: number, end: number): void

	function lineNumberAtPos(pos?: number, absolute?: boolean): number

	// Processes
	let execDirectory: string
	let execPath: string[]

	// Async processes
	interface Process {}
	type Filter = (proc: Process, input: string) => void

	function startProcess(name: string, bufferOrName: BufferOrName, program: string, ...args: string[]): Process
	function setProcessFilter(process: Process, filter: Filter): void
	function processFilter(process: Process): Filter

	// Interactive
	function interactive(arg?: string): void

	// Modules
	interface Symbol { }
	function intern(name: string): Symbol
	function require(symbol: Symbol): void

	//Assertions
	//[Name: string?]
	function stringp(item: any): boolean
}

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
	function sJoin(separator: string, strings: string[]): string;

  //Predicates
  //[elisp: predicate]
  function sEquals(s1: string, s2: string): boolean;
  //[elisp: predicate]
  function sLess(s1: string, s2: string): boolean;
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
