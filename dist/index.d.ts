export interface Stream {
    mimeType: string;
    qualityLabel: string;
    projectionType: string;
    averageBitrate: number;
    bitrate: number;
    url: string;
    signatureCipher: string;
}
export declare const USER_AGENT = "Mozilla/5.0 AppleWebKit/537.36 Chrome/116 Safari/537.36";
export declare function extractVideoId(str: string): string | null;
export declare function getPlayerResponse(videoId: string): Promise<{
    playerResponse: {
        streamingData: {
            adaptiveFormats: Stream[];
            formats: Stream[];
        };
    } | null;
    basejsURL: string;
}>;
export declare function getSCVideoURL(signatureCipher: string, basejsURL: string): Promise<string | null>;
export declare function getVideoURL(videoURL: string, basejsURL: string): Promise<string>;
