# youtube-otosuyatu

**Print download URL**  
Tested on Node.js v18.3.0 (but I think can run on other versions)

If doesn't work, run `git pull`.  
Still doesn't work, report it (idk to fix it)

## Installation

1. `git clone https://github.com/owatu/youtube-otosuyatu`
1. `cd youtube-otosuyatu`
1. `npm install`

### Run

```
$ npm start <videoId> [v(ideo)|a(udio)|b(oth)|o(ut)|mimetype]
```

**Interactive mode (default)**  
`npm start dQw4w9WgXcQ`

**Highest bitrate "video" only**  
`npm start dQw4w9WgXcQ video`  
`npm start dQw4w9WgXcQ v`

**Highest bitrate "audio" only**  
`npm start dQw4w9WgXcQ audio`  
`npm start dQw4w9WgXcQ a`

**Video and audio in one**  
`npm start dQw4w9WgXcQ both`  
`npm start dQw4w9WgXcQ b`

**Specify mimeype (partial match, using `mimeType.includes()`)**  
`npm start dQw4w9WgXcQ mimetype audio/mp4`

open output URL and more overload... (download speed may be low, because streaming)

## special thanksssss

- [Tyrrrz/YoutubeExplode](https://github.com/Tyrrrz/YoutubeExplode)
- https://tyrrrz.me/blog/reverse-engineering-youtube も参考にしてます

## other features

### save `playerResponse` to "./out.json"

```shell
npm start dQw4w9WgXcQ out
```

### `$ youtube-otosuyatu ...`

you can run this anywhere with `youtube-otosuyatu`

```
$ npm link
$ youtube-otosuyatu dQw4w9WgXcQ both
```
