// Turns the finished WAV into an MP3 off the main thread, so the page stays responsive on long voiceovers.
// Encoder: lamejs 1.2.1 (LAME port, LGPL-3.0, vendor/lame.LICENSE.txt). The WAV is read in slices to keep memory low.
importScripts("vendor/lame.min.js");

const SLICE = 1152 * 256 * 2; // bytes of 16-bit mono PCM per step, whole MP3 frames

self.onmessage = async ({ data: { wav, kbps } }) => {
  try {
    const head = new DataView(await wav.slice(0, 44).arrayBuffer());
    const encoder = new lamejs.Mp3Encoder(1, head.getUint32(24, true), kbps);
    const parts = [], total = wav.size - 44;
    for (let pos = 44; pos < wav.size; pos += SLICE) {
      const pcm = new Int16Array(await wav.slice(pos, Math.min(pos + SLICE, wav.size)).arrayBuffer());
      const frame = encoder.encodeBuffer(pcm);
      if (frame.length) parts.push(new Uint8Array(frame.buffer, frame.byteOffset, frame.length));
      self.postMessage({ progress: Math.min(1, (pos - 44 + SLICE) / total) });
    }
    const tail = encoder.flush();
    if (tail.length) parts.push(new Uint8Array(tail.buffer, tail.byteOffset, tail.length));
    self.postMessage({ mp3: new Blob(parts, { type: "audio/mpeg" }) });
  } catch (e) {
    self.postMessage({ error: String((e && e.message) || e) });
  }
};
