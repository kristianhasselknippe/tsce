export interface Pass<TFrom, TTo> {
	perform(ast: TFrom): TTo
}

class Pipeline<TFrom, TTo> {
	
}

class PipelinePass<TFrom, TTo> {

	nextPass?: PipelinePass<TTo, any> = undefined

	constructor(private readonly builder: PipelineBuilder<any,any>, readonly pass: Pass<TFrom, TTo>) {}

	withPass<TNextPass>(pass: Pass<TTo, TNextPass>): PipelinePass<TTo, TNextPass> {
		this.nextPass = new PipelinePass<TTo, TNextPass>(this.builder, pass)
		return this.nextPass
	}

	build(): Pipeline {
		
	}
}

export class PipelineBuilder<TFrom, TTo> {

	private rootPass?: PipelinePass<TFrom, any>

	withPass<TNextPass>(pass: Pass<TFrom, TNextPass>): PipelinePass<TFrom, TNextPass> {
		this.rootPass = new PipelinePass<TFrom, TNextPass>(pass)
		return this.rootPass
	}

	
}
