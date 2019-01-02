declare function tslog(msg: string | number): void

declare interface ElispArray<T> {
	get(index: number): T
	forEach<TOut>(mapper: (input: T) => TOut): ElispArray<TOut>
	push(item: T): void
	pop(): T
	length(): number
}

declare function tsarray<T>(items: T[]): ElispArray<T>

declare module 'emacs' {
	function print(msg: string): void
	function message(msg: string): void

	function length(item: any[] | string): number

	function doWithCurrentBuffer(buffer: Buffer, action: () => void): void

	type EmacsVersion = string

	const systemType: Symbol<"darwin" | "windows-nt" | "gnu/linux">
	const emacsVersion: EmacsVersion
	const emacsMajorVersion: number
	const emacsMinorVersion: number

	//[Name: version<]
	function versionLessThan(version: EmacsVersion, isBefore: EmacsVersion): boolean

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
	type Sentinel = (proc: Process, event: string) => void

	function startProcess(name: string, bufferOrName: BufferOrName, program: string, ...args: string[]): Process

	interface MakeProcessArgs {
		/**Use the string name as the process name; if a process with this name already exists, then name is modified (by appending <1>, etc.) to be unique. */
		name?: string
		/**Use buffer as the process buffer. If the value is nil, the subprocess is not associated with any buffer. */
		buffer?: Buffer
		/**Use command as the command line of the process. The value should be a list starting with the program's executable file name, followed by strings to give to the program as its arguments. If the first element of the list is nil, Emacs opens a new pseudoterminal (pty) and associates its input and output with buffer, without actually running any program; the rest of the list elements are ignored in that case. */
		command?: string[]
		/**If coding is a symbol, it specifies the coding system to be used for both reading and writing of data from and to the connection. If coding is a cons cell (decoding . encoding), then decoding will be used for reading and encoding for writing. The coding system used for encoding the data written to the program is also used for encoding the command-line arguments (but not the program itself, whose file name is encoded as any other file name; see file-name-coding-system).
If coding is nil, the default rules for finding the coding system will apply. See Default Coding Systems. */
		coding?: Symbol
		/**If stopped is non-nil, start the process in the stopped state. */
		stop?: boolean
		/**Initialize the process filter to filter. If not specified, a default filter will be provided, which can be overridden later. See Filter Functions. */
		filter?: Filter
		/**Initialize the process sentinel to sentinel. If not specified, a default sentinel will be used, which can be overridden later. See Sentinels. */
		sentinel?: Sentinel
		/** Associate stderr with the standard error of the process. A non-nil value should be either a buffer or a pipe process created with make-pipe-process, described below.*/
		stderr?: Buffer
	}
	//[NamedArguments]
	function makeProcess(args: MakeProcessArgs): Process
	function setProcessFilter(process: Process, filter: Filter): void
	function processFilter(process: Process): Filter

	function deleteProcess(process: Process): void

	function processSendString(process: Process, str: string): void
	function processSendRegion(process: Process, start: number, end: number): void
	function processSendEof(process?: Process): Process
	function processRunningChildP(process?: Process): boolean

	// Interactive
	function interactive(arg?: string): void

	// Modules
	interface Symbol<T extends string> {}
	function intern<T extends string>(name: T): Symbol<T>
	function require<T extends string>(symbol: Symbol<T>): void
	function symbolName<T extends string>(sym: Symbol<T>): string
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
	function sSplit(separator: string, s: string, omitNulls?: number): string[];
	function sSplitUpTo(
		separator: string,
		s: string,
		n: string,
		omitNulls?: number
	): string[];
	function sJoin(separator: string, strings: string[]): string;

	//Predicates

	//[Predicate]
	function sEquals(s1: string, s2: string): boolean;
	//[Predicate]
	function sLess(s1: string, s2: string): boolean;
	//[Predicate]
	function sMatches(regexp: string, s: string, start?: number): boolean;
	//[Predicate]
	function sBlank(s: string): boolean
	//[Predicate]
	function sPresent(s: string): boolean
	//[Predicate]
	function sEndsWith(suffix: string, s: string, ignoreCase?: boolean): boolean
	//[Predicate]
	function sStartsWith(prefix: string, s: string, ignoreCase?: boolean): boolean
	//[Predicate]
	function sContains(needle: string, s: string, ignoreCase?: boolean): boolean
	//[Predicate]
	function sLowercase (s: string): boolean
	//[Predicate]
	function sUppercase (s: string): boolean
	//[Predicate]
	function sMixedcase (s: string): boolean
	//[Predicate]
	function sCapitalized (s: string): boolean
	//[Predicate]
	function sNumeric (s: string): boolean

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

declare module 'json' {
	function jsonReadFromString<T>(input: string): T
	function jsonEncode<T>(input: T): string
}

declare module 'ert' {
	function equal<T>(a: T, b: T): boolean
	function should(be: boolean): void
}
