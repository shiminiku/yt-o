# youtube otosuyatu

Node.js v14.16.0 で動作確認
名前のまんま  
ダウンロードするための URL を出力してくれます  
めんど臭かったので引数が雑です  

ほとんど [Tyrrrz/YoutubeExplode](https://github.com/Tyrrrz/YoutubeExplode) から学んだものです  
あと https://tyrrrz.me/blog/reverse-engineering-youtube も参考にしてます

https://www.youtube.com/watch?v={videoId}&pbj=1 の pbj=1 は自分で見つけました  
YouTubeのウェブアプリはSPAなので、そのページのデータをやり取りするものだと考えられます  

例: https://www.youtube.com/watch?v=dQw4w9WgXcQ&pbj=1 に**POST**する(GETじゃだめよ)  
そうするといい感じのデータが帰ってきます(あとはご自分で... 最悪ソースコード見てね)

## 使い方

### 1

クローン

```
git clone https://github.com/owatu1234/youtube-otosuyatu.git
```

### 2

依存関係のインストール

```
node install
```

### 3

実行  
videoId のあとに空白はないのでご注意を

```
npm run start <videoId><video|audio|mix>
```

例

```
動画だけ
npm run start dQw4w9WgXcQvideo
音声だけ
npm run start dQw4w9WgXcQaudio
どっちも 画質は最高まで出ない(多分720p30fpsまで)
npm run start dQw4w9WgXcQmix
```

### 4

出力される URL を開く(ストリーミングっぽい感じ)
