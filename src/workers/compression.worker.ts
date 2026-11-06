import LZString from 'lz-string';

export interface CompressionRequest {
  id: string;
  action: 'compress' | 'decompress';
  data: string;
}

export interface CompressionResponse {
  id: string;
  success: boolean;
  result?: string | null;
  error?: string;
}

self.onmessage = (e: MessageEvent<CompressionRequest>) => {
  const { id, action, data } = e.data;
  try {
    if (action === 'compress') {
      const result = LZString.compressToBase64(data);
      self.postMessage({ id, success: true, result });
    } else if (action === 'decompress') {
      const result = LZString.decompressFromBase64(data);
      self.postMessage({ id, success: true, result });
    }
  } catch (err: any) {
    self.postMessage({ id, success: false, error: err?.message || 'Compression error' });
  }
};
