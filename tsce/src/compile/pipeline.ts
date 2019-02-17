export interface Pass<TFrom, TTo> {
	perform(ast: TFrom): TTo
}

export class PipelinePass<TFrom, TTo> {

	nextPass?: PipelinePass<TTo, any>

	constructor(readonly pass: Pass<TFrom, TTo>) {}

	withPass<TNextPass>(pass: Pass<TTo, TNextPass>): PipelinePass<TTo, TNextPass> {
		this.nextPass = new PipelinePass<TTo, TNextPass>(pass)
		return this.nextPass
	}
}

export class PipelineBuilder<TFrom, TTo> {

	private rootPass?: PipelinePass<TFrom, any>

	withPass<TNextPass>(pass: Pass<TFrom, TNextPass>): PipelinePass<TFrom, TNextPass> {
		this.rootPass = new PipelinePass<TFrom, TNextPass>(pass)
		return this.rootPass
	}
}
