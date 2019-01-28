export interface ResponseEvent {
	event: string
}

export interface RequestError {
	code: string
	message: string
	stackTrace?: string
}

export interface Response {
	id: string
	error?: RequestError
}

export interface Request<T extends string> {
	id: string
	method: T
}

interface Location {
	file: string
	offset: number
	length: number
	startLine: number
	startColumn: number
}

export type GetErrorsRequest = Request<'analysis.GetErros'>

interface AnalysisError {
	severity: string
	type: string
	location: Location
	message: string
	correction?: string
	code: string
	hasFix?: boolean
}

export interface GetErrorsResponse extends Response {
	error?: RequestError
	result: {
		errors: AnalysisError[]
	}
}

export interface ServerShutDownRequest extends Request<"server.shutdown"> {
	
}

export interface GetVersionResponse extends Response {
	result: {
		version: string
	}
}

type GetVersionRequest = Request<"server.getVersion">

export interface ServerShutDownResponse extends Response {
  error?: RequestError
}
