export function onRequestGet({ request }) {
    const country = (request.cf && request.cf.country) || request.headers.get('cf-ipcountry') || 'UN';
    return new Response(JSON.stringify({ country: String(country).toUpperCase() }), {
        headers: {
            'content-type': 'application/json; charset=utf-8',
            'cache-control': 'no-store'
        }
    });
}
