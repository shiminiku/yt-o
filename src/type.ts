export interface PlayerResponse {
  responseContext: ResponseContext
  playabilityStatus: PlayabilityStatus
  streamingData?: StreamingData
  captions?: Captions
  videoDetails?: VideoDetails
  storyboards?: Storyboards
  microformat?: Microformat
}

interface Runs {
  runs: Run[]
}

interface Run {
  text: string
}

interface ThumbnailInfo {
  thumbnails: Thumbnail[]
}

interface Thumbnail {
  url: string
  width: number
  height: number
}

interface ResponseContext {
  visitorData: string
  serviceTrackingParams: ServiceTrackingParam[]
  maxAgeSeconds: number
  webResponseContextExtensionData: WebResponseContextExtensionData
}

interface ServiceTrackingParam {
  service: string
  params: Param[]
}

interface Param {
  key: string
  value: string
}

interface WebResponseContextExtensionData {
  webResponseContextPreloadData: WebResponseContextPreloadData
  hasDecorated: boolean
}

interface WebResponseContextPreloadData {
  preloadMessageNames: string[]
}

interface PlayabilityStatus {
  status: string
  playableInEmbed?: boolean
  reason?: string
  errorScreen?: ErrorScreen
  contextParams: string
}

interface ErrorScreen {
  playerErrorMessageRenderer: PlayerErrorMessageRenderer
}

interface PlayerErrorMessageRenderer {
  reason: Runs
  thumbnail: ThumbnailInfo
  icon: Icon
}

interface Icon {
  iconType: string
}

interface StreamingData {
  expiresInSeconds: string
  formats: Format[]
  adaptiveFormats: (VideoAdaptiveFormat | AudioAdaptiveFormat)[]
  serverAbrStreamingUrl?: string
}

export interface MiniFormat {
  url?: string
  signatureCipher?: string
}

export interface BaseFormat {
  itag: number
  url?: string
  mimeType: string
  bitrate: number
  initRange: InitRange
  indexRange: IndexRange
  lastModified: string
  contentLength: string
  quality: string
  projectionType: string
  averageBitrate: number
  approxDurationMs: string
  signatureCipher?: string
}

interface Format extends BaseFormat {
  width: number
  height: number
  fps: number
  audioQuality: string
  audioSampleRate: string
  audioChannels: number
}

interface VideoAdaptiveFormat extends BaseFormat {
  width: number
  height: number
  fps: number
  qualityLabel: string
  approxDurationMs: string
  colorInfo?: ColorInfo
  highReplication?: boolean
}

interface AudioAdaptiveFormat extends BaseFormat {
  highReplication?: boolean
  audioQuality: string
  audioSampleRate: string
  audioChannels: number
  loudnessDb: number
}

interface InitRange {
  start: string
  end: string
}

interface IndexRange {
  start: string
  end: string
}

interface ColorInfo {
  primaries: string
  transferCharacteristics: string
  matrixCoefficients: string
}

interface Captions {
  playerCaptionsTracklistRenderer: PlayerCaptionsTracklistRenderer
}

interface PlayerCaptionsTracklistRenderer {
  captionTracks: CaptionTrack[]
  audioTracks: AudioTrack[]
  translationLanguages: TranslationLanguage[]
  defaultAudioTrackIndex: number
}

interface CaptionTrack {
  baseUrl: string
  name: Runs
  vssId: string
  languageCode: string
  kind: string
  isTranslatable: boolean
  trackName: string
}

interface AudioTrack {
  captionTrackIndices: number[]
}

interface TranslationLanguage {
  languageCode: string
  languageName: Runs
}

interface VideoDetails {
  videoId: string
  title: string
  lengthSeconds: string
  keywords: string[]
  channelId: string
  isOwnerViewing: boolean
  shortDescription: string
  isCrawlable: boolean
  thumbnail: ThumbnailInfo
  allowRatings: boolean
  viewCount: string
  author: string
  isPrivate: boolean
  isUnpluggedCorpus: boolean
  isLiveContent: boolean
}

interface Storyboards {
  playerStoryboardSpecRenderer: PlayerStoryboardSpecRenderer
}

interface PlayerStoryboardSpecRenderer {
  spec: string
  recommendedLevel: number
  highResolutionRecommendedLevel: number
}

interface Microformat {
  playerMicroformatRenderer: PlayerMicroformatRenderer
}

interface PlayerMicroformatRenderer {
  thumbnail: ThumbnailInfo
  embed: Embed
  title: Runs
  description: Runs
  lengthSeconds: string
  ownerProfileUrl: string
  externalChannelId: string
  isFamilySafe: boolean
  availableCountries: string[]
  isUnlisted: boolean
  hasYpcMetadata: boolean
  viewCount: string
  category: string
  publishDate: string
  ownerChannelName: string
  uploadDate: string
  isShortsEligible: boolean
}

interface Embed {
  iframeUrl: string
  width: number
  height: number
}
