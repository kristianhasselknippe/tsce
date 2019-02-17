import { Node, Scope } from '.'

export class SourceFile extends Scope {
	type: string = "SourceFile"

	constructor(readonly fileName: string) {
		super()
	}

	emit(indent: number): string {
		return this.body.map(s => s.emit(indent)).reduce((acc, curr) => `${acc}\n${curr}`, '')
	}

	isSourceFile(): this is SourceFile {
		return true
	}
}
