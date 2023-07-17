import got from "got"

export interface Stream {
  mimeType: string
  qualityLabel: string
  projectionType: string
  averageBitrate: number
  bitrate: number
  url: string
  signatureCipher: string
}

export const USER_AGENT = "Mozilla/5.0 AppleWebKit/537.36 Chrome/116 Safari/537.36"

export function extractVideoId(str: string) {
  const match = str.match(/[0-9a-zA-Z-_]{11}/)
  return match ? match[0] : null
}

export async function getPlayerResponse(videoId: string): Promise<{
  playerResponse: { streamingData: { adaptiveFormats: Stream[]; formats: Stream[] } } | null
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

export async function getSCVideoURL(signatureCipher: string, basejsURL: string) {
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
  const NTokenFn = basejs.match(/function\(.\)\{(var .=.\.split\(""\),.=\[.+?return .\.join\(""\))\};/s)
  if (NTokenFn == null) throw new Error("Could not find n token function")
  const getNToken = new Function("a", NTokenFn[1])

  const url = new URL(videoURL ?? "")
  const origNToken = url.searchParams.get("n")
  const NToken = getNToken(origNToken)
  url.searchParams.set("n", NToken)

  return url.toString()
}

export async function getVideoURL(videoURL: string, basejsURL: string) {
  const basejs = await got(basejsURL).text()
  return await _getVideoURL(videoURL, basejs)
}
