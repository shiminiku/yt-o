#!/usr/bin/env node
import got from "got"
import { writeFile } from "fs/promises"
import { createInterface } from "readline"

function extractId(s) {
  const match = s.match(/[0-9a-zA-Z-_]{11}/)
  return match ? match[0] : null
}

console.log(
  `
💩      💩  💩💩💩💩💩
  💩  💩        💩
    💩          💩
    💩          💩
    💩          💩
  `
)

const videoId = process.argv[2] ? extractId(process.argv[2]) : null

if (!videoId) {
  console.error("!Error! In parameter videoId")
  console.log()
  console.log("Usage")
  console.log(`npm start <videoId> <''|video|audio|both|out|mimetype>

npm start dQw4w9WgXcQ
npm start dQw4w9WgXcQ video
npm start dQw4w9WgXcQ audio
npm start dQw4w9WgXcQ both
npm start dQw4w9WgXcQ mimetype audio/mp4`)
  process.exit()
}

let res = await got(`https://www.youtube.com/watch?v=${videoId}&pbj=1`, {
  method: "POST",
  headers: { "User-Agent": "AppleWebKit Chrome" },
})
let body = JSON.parse(res.body)

let playerResponse
body.forEach((v) => {
  if (v.playerResponse) {
    playerResponse = v.playerResponse

    const videoDetails = v.playerResponse.videoDetails
    console.log(`videoId: \x1b[1m${videoDetails.videoId}\x1b[m`)
    console.log(`title: \x1b[1m${videoDetails.title}\x1b[m`)
    console.log(`author: \x1b[1m${videoDetails.author}\x1b[m`)
    console.log()
  }
})

let filteredStreams = []
let interactiveMode = false
let stream = { bitrate: 0 }
switch (process.argv[3]) {
  case "out":
  case "o":
    console.log('> Detect "out" option')
    await writeFile("./out.json", JSON.stringify(body, null, "  "))
    console.log(`Saved response in ./out.json`)
    process.exit()
  case "video":
  case "v":
    console.log('> Detect "video" option')
    playerResponse.streamingData.adaptiveFormats.forEach((v) => {
      if (v.mimeType.startsWith("video/")) {
        filteredStreams.push(v)
      }
    })
    break
  case "audio":
  case "a":
    console.log('> Detect "audio" option')
    playerResponse.streamingData.adaptiveFormats.forEach((v) => {
      if (v.mimeType.startsWith("audio/")) {
        filteredStreams.push(v)
      }
    })
    break
  case "both":
  case "b":
    console.log('> Detect "both" option')
    playerResponse.streamingData.formats.forEach((v) => {
      filteredStreams.push(v)
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
        filteredStreams.push(v)
      }
    })

    if (!filteredStreams.length) {
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
      const readlineInterface = createInterface({
        input: process.stdin,
        output: process.stdout,
      })
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
  filteredStreams.forEach((v) => {
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

  let tempKey = ""
  let tempStr = ""
  const sigCipher = {}
  for (let char of stream.signatureCipher) {
    switch (char) {
      case "=":
        tempKey = tempStr
        tempStr = ""
        break
      case "&":
        sigCipher[tempKey] = decodeURIComponent(tempStr)
        tempStr = ""
        break
      default:
        tempStr += char
        break
    }
  }
  sigCipher[tempKey] = decodeURIComponent(tempStr)

  body = (await got(`https://www.youtube.com/watch?v=${videoId}`)).body
  body = (await got(`https://www.youtube.com${body.match(/script src="(.*?base.js)"/)[1]}`)).body

  // start with "*.split("")"
  // end with "*.join("")"
  let decipherFuncBody = body.match(/\w+=function\(.+\){(.+split\(""\);(.+?)\..+?.+?;return .+\.join\(""\))}/)
  let operatorsCode = body.match(new RegExp(`var ${decipherFuncBody[2]}={.+?};`, "s"))[0]
  let getSignature = new Function("a", operatorsCode + decipherFuncBody[1])

  console.log(`\nResult: ${sigCipher.url}&${sigCipher.sp}=${encodeURIComponent(getSignature(sigCipher.s))}`)
}
