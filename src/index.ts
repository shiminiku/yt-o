import got from "got"

export interface Stream {
  mimeType: string
  qualityLabel: string
  projectionType: string
  averageBitrate: number
  bitrate: number
  url:string
  signatureCipher:string
}

export function extractVideoId(str: string) {
  const match = str.match(/[0-9a-zA-Z-_]{11}/)
  return match ? match[0] : null
}

export async function getPlayerResponse(videoId: string): Promise<{
  playerResponse: { streamingData: { adaptiveFormats: Stream[]; formats: Stream[] } } | null
  body: string
}> {
  const response = await got(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: { "User-Agent": "Mozilla/5.0 AppleWebKit Chrome/999 Safari" },
  })
  const body = response.body
  const playerResponse = new Function("return " + body.match(/ytInitialPlayerResponse\s*=\s*(\{.*?\});/)?.[1])()

  return { playerResponse, body }
}

function escapeForRegexp(str: string) {
  return str.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&")
}

export async function getVideoURL(signatureCipher: string, basejsLink: string) {
  const sc = new URLSearchParams(signatureCipher)
  const basejs = await got(basejsLink).text()

  // start with "*.split("")"
  // end with "*.join("")"
  const decipherFunction = basejs.match(
    /\w+=function\(.+\){(?<body>.+split\(""\);(?<operations_obj>.+?)\..+?.+?;return .+\.join\(""\))}/
  )
  if (decipherFunction == null) return null
  const operationsCode = basejs.match(new RegExp(`var ${escapeForRegexp(decipherFunction[2])}={.+?};`, "s"))?.[0]
  if (operationsCode == null) return null

  const getSignature = new Function("a", operationsCode + decipherFunction[1])

  try {
    const s = sc.get("s")
    if (s == null) throw new Error("s == null")
    const sig = getSignature(s)
    if (sig == null) throw new Error("could not get signature")

    return `${sc.get("url")}&${sc.get("sp")}=${encodeURIComponent(sig)}`
  } catch {
    return null
  }
}
