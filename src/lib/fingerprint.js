/**
 * Sprinkl Hardware Device Fingerprint
 * 
 * Computes a persistent, cross-browser device fingerprint based on physical hardware,
 * WebGL GPU characteristics, Canvas rasterization, AudioContext frequency response,
 * screen display dimensions, and architecture metrics.
 * 
 * This prevents Sybil attackers from opening different browsers (e.g. Chrome, Safari,
 * Firefox, Opera, Brave, or Incognito) on the same phone to claim a giveaway twice.
 */

// Simple fast 64-bit hashing fallback (cyrb53)
function cyrb53(str, seed = 0) {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

// Compute SHA-256 hex string with graceful cyrb53 fallback
async function hashString(str) {
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const msgUint8 = new TextEncoder().encode(str);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) {
    // fallback
  }
  return cyrb53(str) + cyrb53(str, 42);
}

// Extract WebGL GPU parameters (Unmasked Vendor & Renderer)
function getWebGLInfo() {
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl') ||
      canvas.getContext('webgl2');

    if (!gl) return { vendor: 'none', renderer: 'none', maxTexture: '0' };

    let vendor = 'unknown';
    let renderer = 'unknown';

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || vendor;
      renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || renderer;
    } else {
      vendor = gl.getParameter(gl.VENDOR) || vendor;
      renderer = gl.getParameter(gl.RENDERER) || renderer;
    }

    const maxTexture = gl.getParameter(gl.MAX_TEXTURE_SIZE) || '0';
    return { vendor: String(vendor), renderer: String(renderer), maxTexture: String(maxTexture) };
  } catch {
    return { vendor: 'err', renderer: 'err', maxTexture: '0' };
  }
}

// Extract 2D Canvas rendering signature
function getCanvasSignature() {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 240;
    canvas.height = 60;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'no-2d';

    ctx.textBaseline = 'top';
    ctx.font = "14px 'Arial', sans-serif";
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);

    ctx.fillStyle = '#069';
    ctx.fillText('Sprinkl.biz \uD83D\uDCA7\uD83D\uDE80 #1', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Sprinkl.biz \uD83D\uDCA7\uD83D\uDE80 #1', 4, 17);

    return canvas.toDataURL();
  } catch {
    return 'err';
  }
}

// Extract AudioContext signal (Oscillator + DynamicsCompressor)
async function getAudioFingerprint() {
  try {
    const AudioContext =
      window.OfflineAudioContext ||
      window.webkitOfflineAudioContext;

    if (!AudioContext) return 'no-audio';

    const context = new AudioContext(1, 44100, 44100);
    const oscillator = context.createOscillator();
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(10000, context.currentTime);

    const compressor = context.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-50, context.currentTime);
    compressor.knee.setValueAtTime(40, context.currentTime);
    compressor.ratio.setValueAtTime(12, context.currentTime);
    compressor.attack.setValueAtTime(0, context.currentTime);
    compressor.release.setValueAtTime(0.25, context.currentTime);

    oscillator.connect(compressor);
    compressor.connect(context.destination);

    oscillator.start(0);
    const renderedBuffer = await context.startRendering();

    const channelData = renderedBuffer.getChannelData(0);
    let sampleSum = 0;
    for (let i = 4500; i < 5000; i++) {
      sampleSum += Math.abs(channelData[i]);
    }
    return sampleSum.toFixed(7);
  } catch {
    return 'err';
  }
}

/**
 * Returns a persistent hardware device fingerprint string.
 * Format: "hw_<hash>"
 */
export async function getDeviceFingerprint() {
  if (typeof window === 'undefined') {
    return 'hw_server_env';
  }

  // Check if we already computed and cached it in this browser session
  try {
    const cached = window.sessionStorage?.getItem('sprinkl_hw_fp');
    if (cached) return cached;
  } catch {}

  try {
    // 1. Invariant screen geometry (min/max handles portrait vs landscape rotation)
    const screenWidth = window.screen?.width || 0;
    const screenHeight = window.screen?.height || 0;
    const minDim = Math.min(screenWidth, screenHeight);
    const maxDim = Math.max(screenWidth, screenHeight);
    const colorDepth = window.screen?.colorDepth || 0;
    const dpr = window.devicePixelRatio || 1;

    // 2. Hardware architecture & capabilities
    const hardwareConcurrency = navigator.hardwareConcurrency || 0;
    const maxTouchPoints = navigator.maxTouchPoints || 0;
    const deviceMemory = navigator.deviceMemory || 0;

    // 3. Timezone
    let timeZone = '';
    try {
      timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    } catch {}
    const tzOffset = new Date().getTimezoneOffset();

    // 4. WebGL GPU vendor & renderer
    const webgl = getWebGLInfo();

    // 5. 2D Canvas rendering
    const canvasSig = getCanvasSignature();

    // 6. AudioContext signature
    const audioSig = await getAudioFingerprint();

    // Combine all hardware-tied signals
    const components = [
      minDim,
      maxDim,
      colorDepth,
      dpr,
      hardwareConcurrency,
      maxTouchPoints,
      deviceMemory,
      timeZone,
      tzOffset,
      webgl.vendor,
      webgl.renderer,
      webgl.maxTexture,
      canvasSig,
      audioSig,
    ].join('###');

    const hash = await hashString(components);
    const fp = `hw_${hash.substring(0, 32)}`;

    try {
      window.sessionStorage?.setItem('sprinkl_hw_fp', fp);
      // Also write to localStorage for longevity in the current browser
      localStorage.setItem('sprinkl_device_id', fp);
    } catch {}

    return fp;
  } catch (err) {
    // Extreme fallback: use or generate local device ID
    try {
      let fallback = localStorage.getItem('sprinkl_device_id');
      if (!fallback) {
        fallback = 'dev_' + Math.random().toString(36).substring(2, 11);
        localStorage.setItem('sprinkl_device_id', fallback);
      }
      return fallback;
    } catch {
      return 'dev_' + Math.random().toString(36).substring(2, 11);
    }
  }
}

export default getDeviceFingerprint;
