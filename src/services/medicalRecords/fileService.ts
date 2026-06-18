import * as FileSystem from 'expo-file-system/legacy';
import { ENV } from '@/src/utils/config/env';

export const fileService = {
  /**
   * Helper to convert an ArrayBuffer to a Base64 string in pure JS/TS
   * using chunking to avoid call stack size limitations.
   */
  arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    const chunk = 8192;
    for (let i = 0; i < len; i += chunk) {
      const slice = bytes.subarray(i, i + chunk);
      binary += String.fromCharCode.apply(null, slice as any);
    }
    return btoa(binary);
  },

  /**
   * Downloads a private file from the server via POST to /utils/get-file,
   * caches it in the local app cache, and returns a local file URI.
   */
  async getLocalFileUri(blobName: string, bucket: string, filename: string): Promise<string> {
    const localUri = `${FileSystem.cacheDirectory}${filename}`;
    
    // Check if the file already exists locally
    const fileInfo = await FileSystem.getInfoAsync(localUri);
    if (fileInfo.exists) {
      return localUri;
    }
    
    // Fetch from endpoint
    const response = await fetch(`${ENV.API_BASE_URL}/utils/get-file`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        blob_name: blobName,
        bucket: bucket
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const base64Data = this.arrayBufferToBase64(arrayBuffer);
    
    await FileSystem.writeAsStringAsync(localUri, base64Data, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    return localUri;
  }
};
