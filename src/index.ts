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

export function extractVideoId(str: string) {
  const match = str.match(/[0-9a-zA-Z-_]{11}/)
  return match ? match[0] : null
}

export async function getPlayerResponse(videoId: string): Promise<{
  playerResponse: { streamingData: { adaptiveFormats: Stream[]; formats: Stream[] } } | null
  basejsURL: string
}> {
  const response = await got(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: { "User-Agent": "Mozilla/5.0 AppleWebKit Chrome/999 Safari" },
  })
  const body = response.body

  const playerResponse = new Function("return " + body.match(/ytInitialPlayerResponse\s*=\s*(\{.*?\});/)?.[1])()
  const basejsURL = `https://www.youtube.com${body.match(/[\w./]*?base\.js/)![0]}`

  return { playerResponse, basejsURL }
}

function escapeForRegexp(str: string) {
  return str.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&")
}

export async function getVideoURL(signatureCipher: string, basejsURL: string) {
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
    if (sig == null) throw new Error("could not get signature")

    return `${sc.get("url")}&${sc.get("sp")}=${encodeURIComponent(sig)}`
  } catch (e) {
    console.error(e)

    return null
  }
}
