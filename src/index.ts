import got from "got"

export interface PlayerResponse {
  streamingData: {
    adaptiveFormats: Format[]
    formats: Format[]
  }
}

export interface Format {
  mimeType: string
  qualityLabel: string
  projectionType: string
  averageBitrate: number
  bitrate: number
  url: string
  signatureCipher: string
}

export const USER_AGENT = "Mozilla/5.0 AppleWebKit/537.36 Chrome/128.0.0.0 Safari/537.36"

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
  const response = await got(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: { "User-Agent": USER_AGENT },
  })
  const body = response.body

  const playerResponse = new Function("return " + body.match(/ytInitialPlayerResponse\s*=\s*(\{.*?\});/)?.[1])()
  const basejsURL = `https://www.youtube.com${body.match(/[\w./]*?base\.js/)![0]}`

  return { playerResponse, basejsURL }
}

function escapeForRegexp(str: string) {
  return str.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&")
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
  const basejs = await got(basejsURL).text()

  // start with "*.split("")"
  // end with "*.join("")"
  try {
    const decipherFunction = basejs.match(
      /\w+=function\(.+\){(?<body>.+split\(""\);(?<operations_obj>.+?)\..+?.+?;return .+\.join\(""\))}/
    )
    if (decipherFunction == null) throw new Error("decipherFunction == null")
    const operationsCode = basejs.match(new RegExp(`var ${escapeForRegexp(decipherFunction[2])}={.+?};`, "s"))?.[0]
    if (operationsCode == null) throw new Error("operationsCode == null")

    const getSignature = new Function("a", operationsCode + decipherFunction[1])

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
  const NTokenFn = basejs.match(/=function\(.\){(var .=String\.prototype\.split.+?return Array.prototype.join.+?)}/s)
  if (NTokenFn == null) throw new Error("Could not find n token function")
  const getNToken = new Function("a", NTokenFn[1])

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
  const basejs = await got(basejsURL).text()
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
export async function getStreamURL(format: Format, basejsURL: string): Promise<string | null> {
  if (format.url) {
    return await getVideoURL(format.url, basejsURL)
  } else if (format.signatureCipher) {
    return await getSCVideoURL(format.signatureCipher, basejsURL)
  } else {
    return null
  }
}
