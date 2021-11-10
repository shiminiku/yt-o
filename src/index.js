import got from "got"

export async function getPlayerResponse(videoId) {
  const response = await got(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: { "User-Agent": "AppleWebKit Chrome" }
  })
  const body = response.body
  const playerResponse = new Function("return " + response.body.match(/ytInitialPlayerResponse\s*=\s*(\{.*?\});/)[1])()

  return { playerResponse, body }
}

export async function getURL(signatureCipher, basejsLink) {
  const sigCipher = new URLSearchParams(signatureCipher)
  const basejs = await got(basejsLink).text()

  // start with "*.split("")"
  // end with "*.join("")"
  const decipherFuncBody = basejs.match(/\w+=function\(.+\){(.+split\(""\);(.+?)\..+?.+?;return .+\.join\(""\))}/)
  const operatorsCode = basejs.match(new RegExp(`var ${decipherFuncBody[2]}={.+?};`, "s"))[0]
  const getSignature = new Function("a", operatorsCode + decipherFuncBody[1])

  return `${sigCipher.get("url")}&${sigCipher.get("sp")}=${encodeURIComponent(getSignature(sigCipher.get("s")))}`
}
