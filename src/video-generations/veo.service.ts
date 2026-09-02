import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { readFile } from 'fs/promises';
import { VideoAspectRatio } from '../../generated/prisma/client';

const VEO_MODEL = 'veo-3.1-generate-preview';
const POLL_INTERVAL_MS = 10_000;

interface GenerateVideoInput {
  prompt: string;
  aspectRatio: VideoAspectRatio;
  imagePath?: string;
}

@Injectable()
export class VeoService {
  private readonly logger = new Logger(VeoService.name);
  private client: GoogleGenAI | null = null;

  constructor(private readonly configService: ConfigService) {}

  /** Throws ServiceUnavailableException if GEMINI_API_KEY isn't configured — callers should catch and fail the job cleanly. */
  private getClient(): GoogleGenAI {
    if (this.client) return this.client;

    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'Video generation is not configured (missing GEMINI_API_KEY)',
      );
    }

    this.client = new GoogleGenAI({ apiKey });
    return this.client;
  }

  /**
   * Kicks off a Veo generation, polls until done, and returns the raw video bytes.
   * NOTE: verify field/method names against the current @google/genai docs when wiring
   * a real API key — this SDK surface has moved between versions.
   */
  async generateVideo(input: GenerateVideoInput): Promise<Buffer> {
    const ai = this.getClient();

    const image = input.imagePath
      ? await this.loadImage(input.imagePath)
      : undefined;

    let operation = await ai.models.generateVideos({
      model: VEO_MODEL,
      prompt: input.prompt,
      image,
      config: {
        aspectRatio:
          input.aspectRatio === VideoAspectRatio.PORTRAIT ? '9:16' : '16:9',
        numberOfVideos: 1,
      },
    });

    while (!operation.done) {
      await this.sleep(POLL_INTERVAL_MS);
      operation = await ai.operations.getVideosOperation({ operation });
    }

    const generatedVideo = operation.response?.generatedVideos?.[0]?.video;
    if (!generatedVideo) {
      const failureMessage =
        typeof operation.error?.message === 'string'
          ? operation.error.message
          : 'Veo returned no video';
      throw new Error(failureMessage);
    }

    this.logger.log(
      `Veo generation finished for prompt: "${input.prompt.slice(0, 60)}..."`,
    );
    return this.downloadVideo(ai, generatedVideo);
  }

  private async loadImage(imagePath: string) {
    const buffer = await readFile(imagePath);
    const mimeType = imagePath.endsWith('.png')
      ? 'image/png'
      : imagePath.endsWith('.webp')
        ? 'image/webp'
        : 'image/jpeg';

    return { imageBytes: buffer.toString('base64'), mimeType };
  }

  private async downloadVideo(
    ai: GoogleGenAI,
    video: { uri?: string },
  ): Promise<Buffer> {
    if (!video.uri) {
      throw new Error('Veo response is missing a downloadable video URI');
    }

    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    const response = await fetch(video.uri, {
      headers: { 'x-goog-api-key': apiKey! },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to download generated video: HTTP ${response.status}`,
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
