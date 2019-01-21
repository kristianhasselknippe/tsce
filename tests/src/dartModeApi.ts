import * as emacs from 'emacs'

export interface Request<T extends string> {
	id: string
	method: T
}

export interface Response {
	id: string
}

interface ServerShutDownRequest extends Request {
  id: string
  method: "server.shutdown"
}

interface ServerShutDownResponse extends Response {
  "id": String
  error?: RequestError
}

type Requests = GetVersionRequest
