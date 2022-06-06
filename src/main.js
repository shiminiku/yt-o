#!/usr/bin/env node
import { writeFile } from "fs/promises"
import { createInterface } from "readline"
import { getPlayerResponse, getURL } from "./index.js"

function extractId(s) {
  const match = s.match(/[0-9a-zA-Z-_]{11}/)
  return match ? match[0] : null
}

console.log(`\
💩      💩  💩💩💩💩💩
  💩  💩        💩
    💩          💩
    💩          💩
    💩          💩`)

const videoId = process.argv[2] ? extractId(process.argv[2]) : null

if (!videoId) {
  console.error("[Error] 404 Not Found <videoId>")
  console.log()
  console.log("Usage")
  console.log("npm start <videoId> [v(ideo)|a(udio)|b(oth)|o(ut)|mimetype]")
  console.log("more details, read README.md")
  process.exit(1)
}

const { body, playerResponse } = await getPlayerResponse(videoId)

let suggestStreams = []
let interactiveMode = false
let stream = { bitrate: 0 }
switch (process.argv[3]) {
  case "out":
  case "o":
    console.log('> Detect "out" option')
    await writeFile("./out.json", JSON.stringify(playerResponse, null, "  "))
    console.log(`Saved response in ./out.json`)
    process.exit()
  case "video":
  case "v":
    console.log('> Detect "video" option')
    playerResponse.streamingData.adaptiveFormats.forEach((v) => {
      if (v.mimeType.startsWith("video/")) {
        suggestStreams.push(v)
      }
    })
    break
  case "audio":
  case "a":
    console.log('> Detect "audio" option')
    playerResponse.streamingData.adaptiveFormats.forEach((v) => {
      if (v.mimeType.startsWith("audio/")) {
        suggestStreams.push(v)
      }
    })
    break
  case "both":
  case "b":
    console.log('> Detect "both" option')
    playerResponse.streamingData.formats.forEach((v) => {
      suggestStreams.push(v)
    })
    break
  case "mimetype":
    console.log('> Detect "mimetype" option')
    if (!process.argv[4]) {
      console.error("!Error! In parameter mimetype")
      process.exit()
    }

    playerResponse.streamingData.adaptiveFormats.forEach((v) => {
      if (v.mimeType.includes(process.argv[4])) {
        suggestStreams.push(v)
      }
    })

    if (!suggestStreams.length) {
      console.error(`not found in mimeType="${process.argv[4]}"`)
      process.exit()
    }
    break
  default:
    console.log("> option not detected, enter interactive mode\n")
    interactiveMode = true
    let indexes = []
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

    let answer
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

if (stream.url) {
  console.log("> not detected signature")
  console.log(`\nResult: ${stream.url}`)
} else {
  console.log("> Detect signature")
  const url = await getURL(stream.signatureCipher, `https://www.youtube.com${body.match(/[\w./]*?base\.js/)[0]}`)
  console.log(`\nResult: ${url}`)
}
