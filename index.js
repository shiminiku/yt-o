const needle = require("needle")
const fs = require("fs/promises")
const readline = require("readline")

console.log(
  `
💩      💩  💩💩💩💩💩
  💩  💩        💩
    💩          💩
    💩          💩
    💩          💩
  `
)

console.log(`!!!parameter notify!!!`)
console.log(`videoId: ${process.argv[2]}`)
console.log()

if (!process.argv[2] || process.argv[2].search(/^[0-9a-zA-Z-_]{11}$/) === -1) {
  console.error("!Error! In parameter videoId")
  return
}

needle.post(
  `https://www.youtube.com/watch?v=${process.argv[2]}&pbj=1`,
  null,
  { headers: { "User-Agent": "AppleWebKit/537.36 Chrome/89.0.4389.90" } }, // 360度動画等で動かないならここを変更! わからなければissueおｋ
  async (err, _, body) => {
    if (err != null) {
      console.error("!Error! needle.post")
      return
    }

    let playerResponse
    body.forEach((v) => {
      if (v.playerResponse) {
        playerResponse = v.playerResponse
      }
    })

    let filteredStreams = []
    let interactiveMode = false
    let stream = { bitrate: 0 }
    switch (process.argv[3]) {
      case "out":
        console.log('> Detect "out" option')
        await fs.writeFile("./out.json", JSON.stringify(body, null, "  "))
        console.log(`Saved response in ${__dirname}/out.json`)
        return
      case "video":
        console.log('> Detect "video" option')
        playerResponse.streamingData.adaptiveFormats.forEach((v) => {
          if (v.mimeType.startsWith("video/")) {
            filteredStreams.push(v)
          }
        })
        break
      case "audio":
        console.log('> Detect "audio" option')
        playerResponse.streamingData.adaptiveFormats.forEach((v) => {
          if (v.mimeType.startsWith("audio/")) {
            filteredStreams.push(v)
          }
        })
        break
      case "mix":
        console.log('> Detect "mix" option')
        playerResponse.streamingData.formats.forEach((v) => {
          filteredStreams.push(v)
        })
        break
      case "mimetype":
        console.log('> Detect "mimetype" option')
        if (!process.argv[4]) {
          console.log("!Error! In parameter mimetype")
          return
        }

        playerResponse.streamingData.adaptiveFormats.forEach((v) => {
          if (v.mimeType.includes(process.argv[4])) {
            filteredStreams.push(v)
          }
        })

        if (!filteredStreams.length) {
          console.log(`not found in mimeType="${process.argv[4]}"`)
          return
        }

        console.log(filteredStreams)
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
            process.stdout.write(`${" ".repeat(len)}bitrate:\x1b[92m${v.bitrate}\x1b[m averageBitrate:\x1b[92m${v.averageBitrate}\x1b[m\n`)
          } else {
            console.log(`[${i}] '${v.mimeType}' bitrate:\x1b[92m${v.bitrate}\x1b[m averageBitrate:\x1b[92m${v.averageBitrate}\x1b[m`)
          }
        })

        let answer
        let answered = false
        while (!answered) {
          const readlineInterface = readline.createInterface({
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

    if (!stream.url) {
      console.log("> Detect signature")
      let signatureInfo = {
        s: decodeURIComponent(stream.signatureCipher.match(/s=([^&]*)/)[1]),
        sp: decodeURIComponent(stream.signatureCipher.match(/sp=([^&]*)/)[1]),
        url: decodeURIComponent(stream.signatureCipher.match(/url=([^&]*)/)[1]),
      }

      needle.get(`https://www.youtube.com/watch?v=${process.argv[2]}`, (err, _, body) => {
        needle.get(`https://www.youtube.com${body.match(/script src="(.*?base.js)"/)[1]}`, (e, _, b) => {
          if (e != null) {
            console.error("!Error! needle.get")
            return
          }

          // start with "*.split("")"
          // end with "*.join("")"
          let decipherFuncBody = b.match(/\w+=function\(.+\){(.+split\(""\);(.+?)\..+?.+?;return .+\.join\(""\))}/)

          let operatorsCode = b.match(new RegExp(`var ${decipherFuncBody[2]}={.+?};`, "s"))[0]

          let getSignature = new Function("a", operatorsCode + decipherFuncBody[1])

          console.log(`\nResult: ${signatureInfo.url}&sig=${getSignature(signatureInfo.s)}`)
        })
      })
    } else {
      console.log("> not detected signature")
      console.log(`\nResult: ${stream.url}`)
    }
  }
)
