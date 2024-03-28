import * as CONST from './constants.js'

export type Endpoint = typeof CONST.ENDPOINT_SNAPSHOT | typeof CONST.ENDPOINT_NOTIFY | typeof CONST.ENDPOINT_DEPLOY

export type Method = typeof CONST.METHOD_POST | typeof CONST.METHOD_GET | typeof CONST.METHOD_PUT | typeof CONST.METHOD_DELETE
