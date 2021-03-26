const needle = require("needle")
const fs = require("fs/promises")

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
console.log(
  `videoId: ${process.argv[process.argv.length - 1].substring(0, 11)}`
)
console.log(`outOption: ${process.argv[process.argv.length - 1].substr(11)}\n`)

needle.post(
  `https://www.youtube.com/watch?v=${process.argv[
    process.argv.length - 1
  ].substring(0, 11)}&pbj=1`,
  null,
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
    switch (process.argv[process.argv.length - 1].substr(11)) {
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
        console.log("!Error! Invalid output option")
        return
    }

    let highestBitrateStreaming = { bitrate: 0 }
    filteredStreamings.forEach((v) => {
      if (v.bitrate > highestBitrateStreaming.bitrate) {
        highestBitrateStreaming = v
      }
    })

    if (!highestBitrateStreaming.url) {
      console.log("> Detect signature")
      let signatureInfo = {
        s: decodeURIComponent(
          highestBitrateStreaming.signatureCipher.match(/s=([^&]*)/)[1]
        ),
        sp: decodeURIComponent(
          highestBitrateStreaming.signatureCipher.match(/sp=([^&]*)/)[1]
        ),
        url: decodeURIComponent(
          highestBitrateStreaming.signatureCipher.match(/url=([^&]*)/)[1]
        ),
      }

      needle.get(
        `https://www.youtube.com/watch?v=${process.argv[
          process.argv.length - 1
        ].substring(0, 11)}`,
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
      console.log(`\nResult: ${highestBitrateStreaming.url}`)
    }
  }
)
