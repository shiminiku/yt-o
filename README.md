# youtube-otosuyatu

**Print the download URL**  
Tested on Node.js v18.3.0 (but I think can run on other versions)

If doesn't work, run `git pull`.  
Still doesn't work, report it (idk to fix it)

## Installation

1. `git clone https://github.com/owatu/youtube-otosuyatu`
1. `cd youtube-otosuyatu`
1. `pnpm install`

### Run

```
$ pnpm start <videoId> [v(ideo)|a(udio)|b(oth)|o(ut)|mimetype]
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

open output URL and more overload... (download speed may be low, because streaming)

## special thanksssss

- [Tyrrrz/YoutubeExplode](https://github.com/Tyrrrz/YoutubeExplode)
- https://tyrrrz.me/blog/reverse-engineering-youtube

## other features

### save `playerResponse` to "./out.json"

```shell
pnpm start dQw4w9WgXcQ out
```

### `$ youtube-otosuyatu ...`

you can run this anywhere with `youtube-otosuyatu`

```
$ npm link
$ youtube-otosuyatu dQw4w9WgXcQ both
```
