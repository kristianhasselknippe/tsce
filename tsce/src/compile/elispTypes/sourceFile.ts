import { Node, Scope } from '.'

export class SourceFile extends Scope {
	type: string = "SourceFile"

	emit(indent: number): string {
		return this.body.map(s => s.emit(indent)).reduce((acc, curr) => `${acc}\n${curr}`, '')
	}
}
