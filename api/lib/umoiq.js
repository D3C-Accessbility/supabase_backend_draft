const BASE_URL = "https://webservices.umoiq.com/api/pub/v1";

async function umoiqFetch(path) {
    const res = await fetch(`${BASE_URL}${path}`, {
        headers: {
            "x-umo-iq-api-key": process.env.UMO_API_KEY,
        }
    });

    if (!res.ok){
        const text = await res.text();
        throw new Error(`UmoIQ error ${res.status}: ${text}`);
    }
    const text = await res.text();
    if (!text) {
        return null;
    }
    try {
        return JSON.parse(text);
    } catch (error) {
        throw new Error(`UmoIQ returned invalid JSON: ${text.slice(0, 200)}`);
    }
}

module.exports = { umoiqFetch };

/* example usage:
const { umoiqFetch } = require('./umoiq');
const agencies = await umoiqFetch("/agencies");
- calls https://webservices.umoiq.com/api/pub/v1/agencies
- send our API key
- return parsed JSON response and throw error if something goes wrong
*/
