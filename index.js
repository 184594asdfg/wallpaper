// index.js
export default {
  async fetch(request) {
    const targetUrl = 'https://vapi.pastecuts.cn/booksnap/api/wechat-workbot/callback'
    const url = new URL(request.url)
    const target = new URL(targetUrl)
    target.search = url.search

    const response = await fetch(target.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.method === 'POST' ? await request.text() : null,
      redirect: 'follow'
    })

    return new Response(response.body, {
      status: response.status,
      headers: response.headers
    })
  }
}