
export default function sendBeacon(endpoint: string, body?: string) {
  if (typeof navigator !== 'undefined') {
    navigator.sendBeacon(endpoint, body)
    return
  }

  fetch(endpoint, {
    method: 'POST',
    body,
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then(() => {}, e => console.log(e))

}