declare module 'emacs' {
	const TS: {
		consolelog: (msg: string | number) => void
		len: (array) => number
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
}
