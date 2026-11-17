import LZString from 'lz-string';

export interface CompressionRequest {
  id: string;
  action: 'compress' | 'decompress';
  algo?: 'gzip-base64' | 'lz-base64';
  data: string;
}

export interface CompressionResponse {
  id: string;
  success: boolean;
  result?: string | null;
  error?: string;
}

function uint8ToBase64(bytes: Uint8Array): string {
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function base64ToUint8(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function gzipCompressToBase64(str: string): Promise<string> {
  const encoded = new TextEncoder().encode(str);
  const cs = new CompressionStream('gzip');
  const writer = cs.writable.getWriter();
  writer.write(encoded);
  writer.close();
  const buf = await new Response(cs.readable).arrayBuffer();
  return uint8ToBase64(new Uint8Array(buf));
}

async function gzipDecompressFromBase64(b64: string): Promise<string> {
  const bytes = base64ToUint8(b64);
  const ds = new DecompressionStream('gzip');
  const writer = ds.writable.getWriter();
  writer.write(bytes as unknown as BufferSource);
  writer.close();
  const buf = await new Response(ds.readable).arrayBuffer();
  return new TextDecoder().decode(buf);
}

self.onmessage = async (e: MessageEvent<CompressionRequest>) => {
  const { id, action, algo = 'lz-base64', data } = e.data;
  try {
    if (action === 'compress') {
      if (algo === 'gzip-base64' && typeof CompressionStream !== 'undefined') {
        const result = await gzipCompressToBase64(data);
        self.postMessage({ id, success: true, result });
      } else {
        const result = LZString.compressToBase64(data);
        self.postMessage({ id, success: true, result });
      }
    } else if (action === 'decompress') {
      if (algo === 'gzip-base64' && typeof DecompressionStream !== 'undefined') {
        const result = await gzipDecompressFromBase64(data);
        self.postMessage({ id, success: true, result });
      } else {
        const result = LZString.decompressFromBase64(data);
        self.postMessage({ id, success: true, result });
      }
    }
  } catch (err: any) {
    self.postMessage({ id, success: false, error: err?.message || 'Compression error' });
  }
};

