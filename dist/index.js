import got from "got";
export const USER_AGENT = "Mozilla/5.0 AppleWebKit/537.36 Chrome/116 Safari/537.36";
export function extractVideoId(str) {
    const match = str.match(/[0-9a-zA-Z-_]{11}/);
    return match ? match[0] : null;
}
export async function getPlayerResponse(videoId) {
    const response = await got(`https://www.youtube.com/watch?v=${videoId}`, {
        headers: { "User-Agent": USER_AGENT },
    });
    const body = response.body;
    const playerResponse = new Function("return " + body.match(/ytInitialPlayerResponse\s*=\s*(\{.*?\});/)?.[1])();
    const basejsURL = `https://www.youtube.com${body.match(/[\w./]*?base\.js/)[0]}`;
    return { playerResponse, basejsURL };
}
function escapeForRegexp(str) {
    return str.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&");
}
export async function getVideoURL(signatureCipher, basejsURL) {
    const sc = new URLSearchParams(signatureCipher);
    const basejs = await got(basejsURL).text();
    // start with "*.split("")"
    // end with "*.join("")"
    try {
        const decipherFunction = basejs.match(/\w+=function\(.+\){(?<body>.+split\(""\);(?<operations_obj>.+?)\..+?.+?;return .+\.join\(""\))}/);
        if (decipherFunction == null)
            throw new Error("decipherFunction == null");
        const operationsCode = basejs.match(new RegExp(`var ${escapeForRegexp(decipherFunction[2])}={.+?};`, "s"))?.[0];
        if (operationsCode == null)
            throw new Error("operationsCode == null");
        const getSignature = new Function("a", operationsCode + decipherFunction[1]);
        const s = sc.get("s");
        if (s == null)
            throw new Error("s == null");
        const sig = getSignature(s);
        if (sig == null)
            throw new Error("could not get signature");
        const NTokenFn = basejs.match(/function\(.\)\{(var .=.\.split\(""\),.=\[.+?return .\.join\(""\))\};/s);
        if (NTokenFn == null)
            throw new Error("could not find n token function");
        const getNToken = new Function("a", NTokenFn[1]);
        const url = new URL(sc.get("url") ?? "");
        const origNToken = url.searchParams.get("n");
        const NToken = getNToken(origNToken);
        url.searchParams.set("n", NToken);
        return `${url.toString()}&${sc.get("sp")}=${encodeURIComponent(sig)}`;
    }
    catch (e) {
        console.error(e);
        return null;
    }
}
//# sourceMappingURL=index.js.map