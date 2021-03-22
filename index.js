const needle = require("needle")
const fs = require("fs/promises")

console.log(
  `💩      💩  💩💩💩💩💩
  💩  💩        💩
    💩          💩
    💩          💩
    💩          💩`
)

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

    if (process.argv[process.argv.length - 1] === "out") {
      console.log('> Detect "out" option')
      await fs.writeFile("./out.json", JSON.stringify(b, null, "  "))
      console.log(`Saved response in ${__dirname}/out.json`)
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
      default:
        console.log('> Detect "mixed" option or not detected')
        playerResponse.streamingData.formats.forEach((v) => {
          filteredStreamings.push(v)
        })
        break
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
        "https://www.youtube.com/s/player/223a7479/player_ias.vflset/ja_JP/base.js",
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
            `Result: ${signatureInfo.url}&sig=${getSignature(signatureInfo.s)}`
          )
        }
      )
    } else {
      console.log("> not detected signature")
      console.log(`Result: ${highestBitrateStreaming.url}`)
    }
  }
)
