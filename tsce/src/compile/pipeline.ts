import chalk from 'chalk'

export interface Pass<TFrom, TTo> {
	describe(): string
	perform(ast: TFrom): TTo
}

class Pipeline<TFrom, TTo> {
	constructor(readonly firstPass: PipelinePass<TFrom, any, TFrom, TTo>) {}

	perform(input: TFrom): TTo {
		let currentPass: PipelinePass<any, any, TFrom, TTo> | undefined = this.firstPass
		let nextInput: TFrom | TTo = input
		while (typeof currentPass !== 'undefined') {
			console.log(chalk.blueBright("     - Performing compiler pass: ") + chalk.red(currentPass.pass.describe()))
			nextInput = currentPass.pass.perform(nextInput)
			currentPass = currentPass.nextPass
		}
		return nextInput as TTo
	}
}

class PipelinePass<TFrom, TTo, TPipelineFrom, TPipelineTo> {

	nextPass?: PipelinePass<TTo, any, TPipelineFrom, TPipelineTo> = undefined

	constructor(private readonly builder: PipelineBuilder<TPipelineFrom,TPipelineTo>, readonly pass: Pass<TFrom, TTo>) {}

	withPass<TNextPass>(pass: Pass<TTo, TNextPass>): PipelinePass<TTo, TNextPass, TPipelineFrom, TPipelineTo> {
		this.nextPass = new PipelinePass<TTo, TNextPass, TPipelineFrom, TPipelineTo>(this.builder, pass)
		return this.nextPass
	}

	build(): Pipeline<TPipelineFrom, TPipelineTo> {
		return new Pipeline(this.builder.rootPass!)
	}
}

export class PipelineBuilder<TFrom, TTo> {

	rootPass?: PipelinePass<TFrom, any, TFrom, TTo>

	withPass<TNextPass>(pass: Pass<TFrom, TNextPass>): PipelinePass<TFrom, TNextPass, TFrom, TTo> {
		this.rootPass = new PipelinePass<TFrom, TNextPass, TFrom, TTo>(this, pass)
		return this.rootPass
	}
}
