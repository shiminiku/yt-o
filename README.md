# yt-o

yt download lib & cli

## Install

Install from npm...

```shell
npm install @shiminiku/yt-o
```

Use it!

```javascript
import { getPlayerResponse, getStreamURL } from "@shiminiku/yt-o"

const { playerResponse, basejsURL } = await getPlayerResponse("dQw4w9WgXcQ")
if (playerResponse) {
  const url = await getStreamURL(playerResponse.streamingData.adaptiveFormats[0], basejsURL)
  console.log("URL:", url)
}
```

## Run in CLI

```shell
# once
npm build

npm start <videoId> [v(ideo)|a(udio)|b(oth)|o(ut)|mimetype]
```

**Interactive mode (default)**
`pnpm start dQw4w9WgXcQ`

**Highest bitrate "video" only**
`pnpm start dQw4w9WgXcQ video`
`pnpm start dQw4w9WgXcQ v`

**Highest bitrate "audio" only**
`pnpm start dQw4w9WgXcQ audio`
`pnpm start dQw4w9WgXcQ a`

**Video and audio in one**
`pnpm start dQw4w9WgXcQ both`
`pnpm start dQw4w9WgXcQ b`

**Specify mimeype (partial match, using `mimeType.includes()`)**
`pnpm start dQw4w9WgXcQ mimetype audio/mp4`

## special thanks

- [Tyrrrz/YoutubeExplode](https://github.com/Tyrrrz/YoutubeExplode)
- [Reverse-Engineering YouTube](https://tyrrrz.me/blog/reverse-engineering-youtube)

## other features

### save `playerResponse` to "./out.json"

```shell
pnpm start dQw4w9WgXcQ out
```
