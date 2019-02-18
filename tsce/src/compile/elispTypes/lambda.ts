import { Block, tabs, Identifier, FunctionArg } from "./";

export class Lambda extends Block {
	type: string = "Block"

	constructor(readonly args: FunctionArg[]) {
		super(new Identifier("lambda"))
	}

	get requiredArgs() {
		return this.args.filter(x => typeof x.initializer === 'undefined')
	}

	get optionalArgs() {
		return this.args.filter(x => typeof x.initializer !== 'undefined')
	}

	emitArgs() {
		const requiredArgs = this.requiredArgs;
		const optionalArgs = this.optionalArgs;

		return requiredArgs.reduce(
			(prev, curr) => prev + ' ' + curr.emitForLambda(0),
			''
		) +
			((optionalArgs.length > 0)
			 ? ' &optional ' +
			 optionalArgs.reduce(
				 (prev, curr) => prev + ' ' + curr.emitForLambda(0),
				 ''
			 )
			 : '');
	}

	emitInitializerForOptionalArgs(indent: number) {
		let ret = ''
		for (const arg of this.optionalArgs) {
			ret +=  `${tabs(indent)}(unless ${arg.name.emit(0)} (setq ${arg.name.emit(0)} ${arg.initializer!.emit(0)}))\n`
		}
		return ret
	}

	emitIt(indent: number) {
		return `${tabs(indent+1)}(lambda (${this.emitArgs()})
${this.emitInitializerForOptionalArgs(indent + 1)}
${this.emitBlock(indent + 2, this.emitBody(indent+3))}
${tabs(indent)})`
	}

	emitQuoted(indent: number) {
		return `${tabs(indent)},${this.emitIt(indent)}`
	}

	emit(indent: number) {
		return `${tabs(indent)}${this.emitIt(indent)}`
	}
}
