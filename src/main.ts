#!/usr/bin/env node
import { writeFile } from "fs/promises"
import { createInterface } from "readline"
import { extractVideoId, getPlayerResponse, getVideoURL, Stream } from "./index.js"

console.log(`\
💩      💩  💩💩💩💩💩
  💩  💩        💩
    💩          💩
    💩          💩
    💩          💩
`)

const videoId = extractVideoId(process.argv[2])

if (videoId == null) {
  console.error("[Error] Not found <videoId>")
  console.log()
  console.log("Usage")
  console.log("npm start <videoId> [v(ideo)|a(udio)|b(oth)|o(ut)|mimetype]")
  console.log("more details, read README.md")
  process.exit(1)
}

const { body, playerResponse } = await getPlayerResponse(videoId)
if (playerResponse == null) {
  console.error("[Error] could not get playerResponse")
  process.exit(1)
}

let suggestStreams: Stream[] = []
let interactiveMode = false
let stream: Stream = {
  bitrate: 0,

  mimeType: "",
  qualityLabel: "",
  projectionType: "",
  averageBitrate: 0,
  url: "",
  signatureCipher: "",
}
switch (process.argv[3]) {
  case "out":
  case "o":
    console.log('> Detected "out" option')
    await writeFile("./out.json", JSON.stringify(playerResponse, null, "  "))
    console.log(`Saved response in ./out.json`)
    process.exit()
  case "video":
  case "v":
    console.log('> Detected "video" option')
    playerResponse.streamingData.adaptiveFormats.forEach((v) => {
      if (v.mimeType.startsWith("video/")) {
        suggestStreams.push(v)
      }
    })
    break
  case "audio":
  case "a":
    console.log('> Detected "audio" option')
    playerResponse.streamingData.adaptiveFormats.forEach((v) => {
      if (v.mimeType.startsWith("audio/")) {
        suggestStreams.push(v)
      }
    })
    break
  case "both":
  case "b":
    console.log('> Detected "both" option')
    playerResponse.streamingData.formats.forEach((v) => {
      suggestStreams.push(v)
    })
    break
  case "mimetype":
    console.log('> Detected "mimetype" option')
    const mimetype = process.argv[4]
    if (!mimetype) {
      console.error("[Error] Not found mimetype argument")
      process.exit(1)
    }

    playerResponse.streamingData.adaptiveFormats.forEach((v) => {
      if (v.mimeType.includes(mimetype)) {
        suggestStreams.push(v)
      }
    })

    if (!suggestStreams.length) {
      console.error(`[Error] Not found stream for specified mimetype(${mimetype})`)
      process.exit(1)
    }
    break
  default:
    console.log()
    interactiveMode = true
    let indexes: number[] = []
    playerResponse.streamingData.adaptiveFormats.forEach((v, i) => {
      indexes.push(i)
      let len = `[${i}] `.length
      if (v.qualityLabel) {
        process.stdout.write(`[${i}] ${v.mimeType} \x1b[94m${v.qualityLabel}\x1b[m ForVR:`)
        if (v.projectionType === "MESH") {
          process.stdout.write(`\x1b[92m${v.projectionType === "MESH"}\x1b[m\n`)
        } else {
          process.stdout.write(`\x1b[91m${v.projectionType === "MESH"}\x1b[m\n`)
        }
        process.stdout.write(
          `${" ".repeat(len)}bitrate:\x1b[92m${v.bitrate}\x1b[m averageBitrate:\x1b[92m${v.averageBitrate}\x1b[m\n`
        )
      } else {
        console.log(
          `[${i}] '${v.mimeType}' bitrate:\x1b[92m${v.bitrate}\x1b[m averageBitrate:\x1b[92m${v.averageBitrate}\x1b[m`
        )
      }
    })

    let answer: string
    let answered = false
    while (!answered) {
      const readlineInterface = createInterface({ input: process.stdin })
      answer = await new Promise((resolve) => {
        readlineInterface.question("enter number > ", (answer) => {
          resolve(answer)
          readlineInterface.close()
        })
      })

      answered = indexes.includes(parseInt(answer))
    }
    stream = playerResponse.streamingData.adaptiveFormats[answer]
}

if (!interactiveMode) {
  suggestStreams.forEach((v) => {
    if (v.bitrate > stream.bitrate) {
      stream = v
    }
  })
}

console.log()
if (stream.url) {
  console.log(`${stream.url}`)
} else {
  const url = await getVideoURL(stream.signatureCipher, body)
  console.log(`${url}`)
}
