# youtube-otosuyatu

また User-Agent により、360 度動画等に対応しているかを識別しているため、将来的に[index.js の 27 行目](https://github.com/owatu1234/youtube-otosuyatu/blob/main/index.js#L27)を変更しないと動かないかもしれません

Node.js v14.16.0 で動作確認
名前のまんま  
ダウンロードするための URL を出力してくれます

## 長いなにか

ほとんど [Tyrrrz/YoutubeExplode](https://github.com/Tyrrrz/YoutubeExplode) から学んだものです  
https://tyrrrz.me/blog/reverse-engineering-youtube も参考にしてます

https://www.youtube.com/watch?v={videoId}&pbj=1 の pbj=1 は自分で見つけました  
YouTube のウェブアプリは SPA なので、そのページのデータをやり取りするものだと考えられます

例: https://www.youtube.com/watch?v=dQw4w9WgXcQ&pbj=1 に**POST**する(GET じゃだめよ)  
そうするといい感じのデータがかえってきます(あとはご自分で...最悪ソースコード見てね)

## 使い方

### 1.クローン

```
git clone https://github.com/owatu1234/youtube-otosuyatu.git
```

### 2.依存関係のインストール

```
node install
```

### 3.実行

```shell
npm run start <videoId> <''|video|audio|mix|out|mimetype>

#対話モード(デフォルト)
#リストが出力されるので、数字を入れて選択できます)
#リストでは色付けをしています
npm start dQw4w9WgXcQ

#最もビットレートの高い動画 (動画、音声は別れている)
npm start dQw4w9WgXcQ video

#最もビットレートの高い音声 (音声、動画は別れている)
npm start dQw4w9WgXcQ audio

#どっちも 画質は最高まで出ない(多分720p30fpsまで)
npm start dQw4w9WgXcQ mix

#mimeTypeを指定する 部分的な文字列で可能 検索方法は`includes`
npm start dQw4w9WgXcQ mimetype <mimeType>
```

### 4

出力される URL を開く(ストリーミングっぽい感じ)

## 他にも...

### レスポンスの保存 ~~Postman 使え~~

https://www.youtube.com/watch?v={videoId}&pbj=1 のレスポンスが保存できます  
同じディレクトリに out.json が生成されます

```shell
npm start dQw4w9WgXcQ out
```

### グローバルにインストールした**様に**

以下を実行すると`yt-otosuyatu`だけで実行できるようになります

```shell
npm link
```

## { "en": ":)", "ja": "(^\_^)" }

ここまでよんでくれてありがとう!!  
ひまじんだから、ようぼうをうけつけているよ!!  
てきとうにいしゅーをなげると、てきとうにじっそうするかも!!  
かいぜんてん、まってるよ!!  
~~はぁ〜、IQ 下がった?~~
