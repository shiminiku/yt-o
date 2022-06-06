import { getPlayerResponse, getURL } from "../src/index"
import got from "got"

test("getPlayerResponse", async () => {
  const { playerResponse } = await getPlayerResponse("dQw4w9WgXcQ")
  expect(playerResponse?.playabilityStatus?.status).toBe("OK")
})

test("getURL", async () => {
  const { playerResponse, body } = await getPlayerResponse("dQw4w9WgXcQ")
  const formats = playerResponse?.streamingData?.formats
  const signatureCipher = formats[formats.length - 1]?.signatureCipher

  expect(formats && signatureCipher).toBeTruthy()

  const url = await getURL(signatureCipher, `https://www.youtube.com${body.match(/[\w./]*?base\.js/)[0]}`)
  expect(url?.search(/^https:\/\/[^.]*\.googlevideo\.com/) > -1).toBe(true)

  const response = await got(url, { method: "HEAD" })
  expect(response.statusCode).toBe(200)
})
