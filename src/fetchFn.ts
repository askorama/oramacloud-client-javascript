import { Method } from "./types.js"


export default async function fetchFn(url: string, method: Method, headers: Record<string, string>, body?: object): Promise<Response> {
  const requestOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  }

  if (method === 'POST' && body !== undefined) {
    requestOptions.body = JSON.stringify(body)
  }

  console.log(requestOptions)
  return await fetch(url, requestOptions)
}