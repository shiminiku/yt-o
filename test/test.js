import { getPlayerResponse, getSCVideoURL, getVideoURL } from "../dist/index"
import got from "got"

const VIDEO_ID = "dQw4w9WgXcQ"

test("getPlayerResponse", async () => {
  const { playerResponse } = await getPlayerResponse(VIDEO_ID)
  expect(playerResponse?.playabilityStatus?.status).toBe("OK")
})

test("getURL", async () => {
  const { playerResponse, basejsURL } = await getPlayerResponse("jNQXAC9IVRw")
  const formats = playerResponse?.streamingData?.formats
  const url = formats.at(-1)?.url

  expect(formats && url).toBeTruthy()

  const videoURL = await getVideoURL(url, basejsURL)
  expect(videoURL?.search(/^https:\/\/[^.]*\.googlevideo\.com/) > -1).toBe(true)

  const response = await got(videoURL, { method: "HEAD" })
  console.log(response.statusCode)
  expect(response.statusCode).toBe(200)
})

test("getSCURL", async () => {
  const { playerResponse, basejsURL } = await getPlayerResponse(VIDEO_ID)
  const formats = playerResponse?.streamingData?.formats
  const signatureCipher = formats.at(-1)?.signatureCipher

  expect(formats && signatureCipher).toBeTruthy()

  const videoURL = await getSCVideoURL(signatureCipher, basejsURL)
  expect(videoURL?.search(/^https:\/\/[^.]*\.googlevideo\.com/) > -1).toBe(true)

  const response = await got(videoURL, { method: "HEAD" })
  console.log(response.statusCode)
  expect(response.statusCode).toBe(200)
})
