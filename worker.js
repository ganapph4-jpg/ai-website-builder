// Cloudflare Worker - Proxy /website-builder to Vercel
// After deploying AI Builder to Vercel, update this URL:
const VERCEL_URL = 'https://YOUR_PROJECT.vercel.app';

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (!url.pathname.startsWith('/website-builder')) {
      return fetch(request);
    }

    const targetUrl = VERCEL_URL + url.pathname + url.search;

    const proxyRequest = new Request(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });
    proxyRequest.headers.set('Host', new URL(VERCEL_URL).host);

    const response = await fetch(proxyRequest);

    const proxyResponse = new Response(response.body, response);

    const location = proxyResponse.headers.get('Location');
    if (location) {
      proxyResponse.headers.set('Location', location.replace(VERCEL_URL, url.origin));
    }

    return proxyResponse;
  },
};
