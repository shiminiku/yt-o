#!/usr/bin/env node
import { writeFile } from "fs/promises"
import { createWriteStream } from "fs"
import { createInterface } from "readline"
import { extractVideoId, getVideoURL, getSCVideoURL, USER_AGENT, BaseFormat, getWatchPage } from "./index.js"

function printUsage() {
  console.log()
  console.log("Usage")
  console.log("npm start <videoId> [v(ideo)|a(udio)|b(oth)|o(ut)|mimetype]")
  console.log("more details, read README.md")
}

console.log(`\
💩      💩  💩💩💩💩💩
  💩  💩        💩
    💩          💩
    💩          💩
    💩          💩
`)

if (process.argv[2] == undefined) {
  console.error("[Error] Not found <videoId>")
  printUsage()
  process.exit(1)
}

const videoId = extractVideoId(process.argv[2])

if (videoId == null) {
  console.error("[Error] Not found <videoId>")
  printUsage()
  process.exit(1)
}

let download = false
download = process.argv.includes("--download")

const { playerResponse, basejsURL } = await getWatchPage(videoId)
if (playerResponse == null) {
  console.error("[Error] could not get playerResponse")
  process.exit(1)
}
if (playerResponse.streamingData == null) {
  console.error("[Error] could not get streamingData")
  process.exit(1)
}

let suggestStreams: BaseFormat[] = []
let interactiveMode = false
let stream: BaseFormat = {
  itag: 0,
  mimeType: "",
  bitrate: 0,
  initRange: { start: "", end: "" },
  indexRange: { start: "", end: "" },
  lastModified: "",
  contentLength: "",
  quality: "",
  projectionType: "",
  averageBitrate: 0,
  approxDurationMs: "",
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
      if ("qualityLabel" in v) {
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

    let answer = -1
    let answered = false
    while (!answered) {
      const readlineInterface = createInterface({ input: process.stdin, output: process.stdout })
      answer = await new Promise((resolve) => {
        readlineInterface.question("Enter number > ", (answer) => {
          resolve(parseInt(answer))
          readlineInterface.close()
        })
      })

      answered = indexes.includes(answer)
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

const url = stream.url
  ? await getVideoURL(stream.url, basejsURL)
  : stream.signatureCipher
  ? await getSCVideoURL(stream.signatureCipher, basejsURL)
  : null
if (url == null) {
  console.error("[Error] Could not get URL")
  printUsage()
  process.exit(1)
}

if (download) {
  const dlStart = Date.now()

  console.log(`Getting head...`)
  const head = await fetch(url, { method: "HEAD", headers: { "User-Agent": USER_AGENT } })
  const len = parseInt(head.headers.get("content-length") ?? "-1")
  console.log(head.headers)
  console.log(`...done`)

  const fname = `./out_${Date.now()}.bin`
  const f = createWriteStream(`./out_${Date.now()}.bin`)
  console.log(`Save to ${fname}`)

  let gotUntil = 0
  while (gotUntil < len) {
    const startByte = gotUntil
    const endByte = Math.min(gotUntil + 10_000_000 - 1, len - 1)

    console.log(`REQ ${startByte.toLocaleString()} - ${endByte.toLocaleString()} / ${len.toLocaleString()} ...`)
    const tstart = Date.now()
    const res = await fetch(url + `&range=${startByte}-${endByte}`, {
      // method: "POST",
      headers: { /* Range: `bytes=${startByte}-${endByte}`, */ "User-Agent": USER_AGENT },
      // body: "x\u0000",
    })
    const tend = Date.now()

    const gotLen = parseInt(res.headers.get("content-length") ?? "0")
    gotUntil += gotLen
    const speed = Math.round((gotLen / (tend - tstart)) * 1000)
    console.log(
      "...GOT",
      gotLen.toLocaleString(),
      "bytes",
      "in",
      (tend - tstart).toLocaleString(),
      "ms",
      `(${speed.toLocaleString()} bytes/s)`
    )

    f.write(new Uint8Array(await res.arrayBuffer()))

    const delay = Math.floor(Math.random() * 300 + 100)
    console.log("delay:", delay.toLocaleString(), "ms")
    await new Promise<void>((resolve) => setTimeout(() => resolve(), delay))

    console.log("|")
  }
  console.log("|")
  f.end()

  const dlEnd = Date.now()

  console.log(`Done in ${(dlEnd - dlStart).toLocaleString()} ms! ${fname}`)
} else {
  console.log(url)
}
