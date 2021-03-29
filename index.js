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

console.log(`!!!Options notify!!!`)
console.log(`videoId: ${process.argv[2]}`)
console.log(`outOption: ${process.argv[3]}\n`)

if (process.argv[2].search(/^[0-9a-zA-Z-_]{11}$/) === -1) {
  console.error("!Error! In videoId")
  return
}

needle.post(
  `https://www.youtube.com/watch?v=${process.argv[2]}&pbj=1`,
  null,
  { headers: { "User-Agent": "AppleWebKit/537.36 Chrome/89.0.4389.90" } }, // 360度動画等で動かないならここを変更! わからなければissueおｋ
  async (e, _, b) => {
    if (e != null) {
      console.error("!Error! needle.post")
      return
    }

    let playerResponse
    b.forEach((v) => {
      if (v.playerResponse) {
        playerResponse = v.playerResponse
      }
    })

    let filteredStreamings = []
    let interactiveMode = false
    let streaming = { bitrate: 0 }
    switch (process.argv[3]) {
      case "out":
        console.log('> Detect "out" option')
        await fs.writeFile("./out.json", JSON.stringify(b, null, "  "))
        console.log(`Saved response in ${__dirname}/out.json`)
        return
      case "video":
        console.log('> Detect "video" option')
        playerResponse.streamingData.adaptiveFormats.forEach((v) => {
          if (v.mimeType.startsWith("video/")) {
            filteredStreamings.push(v)
          }
        })
        break
      case "audio":
        console.log('> Detect "audio" option')
        playerResponse.streamingData.adaptiveFormats.forEach((v) => {
          if (v.mimeType.startsWith("audio/")) {
            filteredStreamings.push(v)
          }
        })
        break
      case "mix":
        console.log('> Detect "mix" option')
        playerResponse.streamingData.formats.forEach((v) => {
          filteredStreamings.push(v)
        })
        break
      default:
        console.log("> option not detected, enter interactive mode\n")
        interactiveMode = true
        let indexes = []
        playerResponse.streamingData.adaptiveFormats.forEach((v, i) => {
          indexes.push(i)
          let len = `[${i}] `.length
          if (v.qualityLabel) {
            process.stdout.write(
              `[${i}] ${v.mimeType} \x1b[94m${v.qualityLabel}\x1b[m ForVR:`
            )
            if (v.projectionType === "MESH") {
              process.stdout.write(
                `\x1b[92m${v.projectionType === "MESH"}\x1b[m\n`
              )
            } else {
              process.stdout.write(
                `\x1b[91m${v.projectionType === "MESH"}\x1b[m\n`
              )
            }
            process.stdout.write(
              `${" ".repeat(len)}bitrate:\x1b[92m${
                v.bitrate
              }\x1b[m averageBitrate:\x1b[92m${v.averageBitrate}\x1b[m\n`
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
        streaming = playerResponse.streamingData.adaptiveFormats[answer]
    }

    if (!interactiveMode) {
      filteredStreamings.forEach((v) => {
        if (v.bitrate > streaming.bitrate) {
          streaming = v
        }
      })
    }

    if (!streaming.url) {
      console.log("> Detect signature")
      let signatureInfo = {
        s: decodeURIComponent(streaming.signatureCipher.match(/s=([^&]*)/)[1]),
        sp: decodeURIComponent(
          streaming.signatureCipher.match(/sp=([^&]*)/)[1]
        ),
        url: decodeURIComponent(
          streaming.signatureCipher.match(/url=([^&]*)/)[1]
        ),
      }

      needle.get(
        `https://www.youtube.com/watch?v=${process.argv[2]}`,
        (e, _, b) => {
          needle.get(
            `https://www.youtube.com${b.match(/script src="(.*?base.js)"/)[1]}`,
            (e, _, b) => {
              if (e != null) {
                console.error("!Error! needle.get")
                return
              }

              // start with "*.split("")"
              // end with "*.join("")"
              let decipherFuncBody = b.match(
                /\w+=function\(.+\){(.+split\(""\);(.+?)\..+?.+?;return .+\.join\(""\))}/
              )

              let operatorsCode = b.match(
                new RegExp(`var ${decipherFuncBody[2]}={.+?};`, "s")
              )[0]

              let getSignature = new Function(
                "a",
                operatorsCode + decipherFuncBody[1]
              )

              console.log(
                `\nResult: ${signatureInfo.url}&sig=${getSignature(
                  signatureInfo.s
                )}`
              )
            }
          )
        }
      )
    } else {
      console.log("> not detected signature")
      console.log(`\nResult: ${streaming.url}`)
    }
  }
)
