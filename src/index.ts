import { PlayerResponse, MiniFormat, BaseFormat } from "./type.js"

export const USER_AGENT = "Mozilla/5.0 AppleWebKit/537.36 Chrome/128.0.0.0 Safari/537.36"
export const USER_AGENT_IOS =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1"

class RespError extends Error {
  cause?: Response
  constructor(msg?: string, opt?: ErrorOptions) {
    super(msg, opt)
  }
}

/**
 * Extracts the videoId from a URL.
 *
 * @param str The string containing a videoId.
 * @returns The `videoId ([0-9a-zA-Z-_]{11})`. Returns `null` if a videoId is not found.
 *
 * @example
 * ```typescript
 * extractVideoId('https://www.youtube.com/watch?v=jNQXAC9IVRw'); // 'jNQXAC9IVRw'
 * extractVideoId('https://www.youtube.com/'); // null
 * ```
 */
export function extractVideoId(str: string): string | null {
  const match = str.match(/[0-9a-zA-Z-_]{11}/)
  return match ? match[0] : null
}

/**
 * Fetches the PlayerResponse for a video.
 *
 * @param videoId The videoId to fetch.
 * @returns A promise that resolves to an object containing the PlayerResponse and the baseJS URL for later use.
 *
 * @example
 * ```typescript
 * getPlayerResponse('jNQXAC9IVRw').then((response) => {
 *   console.log(response.basejsURL);
 *   console.log(response.playerResponse.streamingData.adaptiveFormats);
 * });
 * ```
 */
export async function getPlayerResponse(videoId: string): Promise<{
  playerResponse?: PlayerResponse
  basejsURL: string
}> {
  const resp = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: { "User-Agent": USER_AGENT },
  })
  const body = await resp.text()

  const match = body.match(/ytInitialPlayerResponse\s*=\s*(\{.*?\});/)

  const playerResponse = JSON.parse(match?.[1] ?? "null")
  const basejsURL = `https://www.youtube.com${body.match(/[\w./]*?base\.js/)![0]}`

  return { playerResponse, basejsURL }
}

function escapeForRegexp(str: string) {
  return str.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&")
}

/**
 * Get watch page related infos.
 *
 * @param videoId The videoId to fetch.
 * @returns A promise that resolves to an object containing watch page related infos.
 * @throws {RespError}
 *
 * @example
 * ```typescript
 * getPlayerResponse('jNQXAC9IVRw').then((response) => {
 *   console.log(response.basejsURL);
 *   console.log(response.playerResponse.streamingData.adaptiveFormats);
 * });
 * ```
 */
export async function getWatchPage(videoId: string): Promise<{
  ytcfg: any
  playerResponse: PlayerResponse
  basejsURL: string
  signatureTimestamp: number
}> {
  const resp = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: { "User-Agent": USER_AGENT_IOS },
  })
  if (resp.status !== 200) {
    throw new RespError(`statusCode is not 200. it's: ${resp.status} ${resp.statusText}`, { cause: resp })
  }
  const body = await resp.text()

  const ytcfgText = body.match(/ytcfg\.set\(({.+})\)/)?.[1]
  const ytcfg = JSON.parse(ytcfgText ?? "null")

  const prText = body.match(/ytInitialPlayerResponse\s*=\s*(\{.*?\});/)?.[1]
  const playerResponse = JSON.parse(prText ?? "null")

  const basejsURL = `https://www.youtube.com${ytcfg.PLAYER_JS_URL}`
  const basejs = await fetch(basejsURL).then((r) => r.text())
  const signatureTimestamp = parseInt(basejs.match(/signatureTimestamp:(\d+)/)?.[1] ?? "-1")

  return { ytcfg, playerResponse, basejsURL, signatureTimestamp }
}

/**
 * Generates the optimized video URL from a SignatureCipher.
 *
 * @param signatureCipher SignatureCipher (a scrambled token)
 * @param basejsURL The base URL for the YouTube JavaScript player.
 * @returns A promise that resolves to the video URL (string) or null if the URL cannot be generate.
 * @throws {Error}  If the video URL cannot be optimized.
 *
 * @example
 * ```typescript
 * getSCVideoURL('dQw4w9WgXcQ') => {
 *   if (url) {
 *     console.log('Video URL:', url);
 *   } else {
 *     console.error('Failed to extract video URL');
 *   }
 * });
 * ```
 */
export async function getSCVideoURL(signatureCipher: string, basejsURL: string): Promise<string | null> {
  const sc = new URLSearchParams(signatureCipher)
  const basejs = await fetch(basejsURL).then((r) => r.text())

  // start with "*.split("")"
  // end with "*.join("")"
  try {
    const desc = extractDeSCCode(basejs)
    const getSignature = new Function("s", `${desc.code}\nreturn ${desc.fnName}(s)`)

    const s = sc.get("s")
    if (s == null) throw new Error("s == null")
    const sig = getSignature(s)
    if (sig == null) throw new Error("Could not get signature")

    return `${await _getVideoURL(sc.get("url") ?? "", basejs)}&${sc.get("sp")}=${encodeURIComponent(sig)}`
  } catch (e) {
    console.error(e)
    return null
  }
}

async function _getVideoURL(videoURL: string, basejs: string) {
  const nToken = extractNTokenCode(basejs)
  const getNToken = new Function("n", `${nToken.code}\nreturn ${nToken.fnName}(n)`)

  const url = new URL(videoURL ?? "")
  const origNToken = url.searchParams.get("n")
  const NToken = getNToken(origNToken)
  url.searchParams.set("n", NToken)

  return url.toString()
}

/**
 * Generates the optimized video URL from a url.
 *
 * @param videoURL The original video URL.
 * @param basejsURL The baseJS URL.
 * @returns A promise that resolves to the optimized video URL (string).
 * @throws {Error}  If the video URL cannot be optimized.
 *
 * @example
 * ```typescript
 * getVideoURL('https://rr0---sn-abcd1234.googlevideo.com/videoplayback?expire=...')
 *   .then(url => {
 *     console.log('Fast video URL:', url);
 *   })
 * ```
 */
export async function getVideoURL(videoURL: string, basejsURL: string): Promise<string> {
  const basejs = await fetch(basejsURL).then((r) => r.text())
  return await _getVideoURL(videoURL, basejs)
}

/**
 * Generates a video URL optimized for fast download.
 *
 * @param format The Format to download.
 * @param basejsURL The baseJS URL.
 * @returns A promise that resolves to the video URL (string) or null if the URL cannot be generated.
 * @example
 * ```typescript
 *
 * const { playerResponse, basejsURL } = await getPlayerResponse('dQw4w9WgXcQ');
 * getStreamURL(playerResponse.streamingData.adaptiveFormats[0], basejsURL)
 *   .then(url => {
 *     if (url) {
 *       console.log('video URL:', url);
 *     } else {
 *       console.warn('Failed to generate video URL');
 *     }
 *   });
 * ```
 */
export async function getStreamURL(format: MiniFormat, basejsURL: string): Promise<string | null> {
  if (format.url) {
    return await getVideoURL(format.url, basejsURL)
  } else if (format.signatureCipher) {
    return await getSCVideoURL(format.signatureCipher, basejsURL)
  } else {
    return null
  }
}

function extractDeSCCode(basejs: string) {
  const decipherFunction = basejs.match(
    /(?<fname>\w+?)=function\(.+\){(?<body>.+split\(""\);(?<operations_obj>.+?)\..+?.+?;return .+\.join\(""\))}/
  )
  if (decipherFunction == null) throw new Error("decipherFunction == null")
  const operationsCode = basejs.match(new RegExp(`var ${escapeForRegexp(decipherFunction[3])}={.+?};`, "s"))?.[0]
  if (operationsCode == null) throw new Error("operationsCode == null")

  const getDeSigCode = operationsCode + "\nvar " + decipherFunction[0]

  return { code: getDeSigCode, fnName: decipherFunction[1] }
}

const NT_FNAME_REGEX = /^var [$a-zA-Z0-9]+?=\[([$a-zA-Z0-9]+?)\]/m
function extractNTokenCode(basejs: string) {
  // var ABc=[DEf]
  const fnName = basejs.match(NT_FNAME_REGEX)?.[1]
  if (fnName == null) throw new Error("Could not find n token function name")

  const NTokenFn = basejs.match(
    new RegExp(`${escapeForRegexp(fnName)}=function\\(.\\)\\{(.+?return.+?join.+?)\\};`, "s")
  )
  if (NTokenFn == null) throw new Error("Could not find n token function")

  const getNTokenCode = "var " + NTokenFn[0]

  return { code: getNTokenCode, fnName: fnName }
}

/**
 * Generates JS code from `base.js`.
 * This is used to decrypt two types of tokens -- SignatureCipher and "n" parameter
 *
 * @param basejs The `base.js` from YT.
 * @returns A ESM JavaScript code contains `deSC(s)`, `getNToken(n)` functions.
 */
export function generateSigCodes(basejs: string) {
  const deSCCode = extractDeSCCode(basejs)
  const getNTokenCode = extractNTokenCode(basejs)

  return (
    deSCCode.code +
    `\nexport function deSC(s){return ${deSCCode.fnName}(s)}\n` +
    getNTokenCode.code +
    `\nexport function getNToken(n){return ${getNTokenCode.fnName}(n)}`
  )
}

export { PlayerResponse, MiniFormat, BaseFormat }
