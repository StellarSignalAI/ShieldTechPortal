/* On-device AI vision for Survey Scan — real detection, no server round-trip.
   · Objects/furniture: COCO-SSD (chairs, couches, tables, displays, appliances…)
   · Surfaces: DeepLab ADE20k semantic segmentation (wall / ceiling / floor / door / window)
   Models lazy-load on first use (they are heavy); window.__shieldVision is the API. */

let detPromise = null;
let segPromise = null;

async function loadDetector() {
  if (!detPromise) {
    detPromise = (async () => {
      await import('@tensorflow/tfjs');
      const coco = await import('@tensorflow-models/coco-ssd');
      return coco.load({ base: 'lite_mobilenet_v2' });
    })();
  }
  return detPromise;
}

async function loadSegmenter() {
  if (!segPromise) {
    segPromise = (async () => {
      await import('@tensorflow/tfjs');
      const dl = await import('@tensorflow-models/deeplab');
      return dl.load({ base: 'ade20k', quantizationBytes: 2 });
    })();
  }
  return segPromise;
}

/* COCO class → survey object vocabulary (type keys match SS_OBJ registry) */
const COCO_MAP = {
  chair: { label: 'Chair', type: 'desk' }, couch: { label: 'Couch', type: 'couch' },
  bed: { label: 'Bed', type: 'couch' }, 'dining table': { label: 'Table / counter', type: 'counter' },
  tv: { label: 'Display / monitor', type: 'display' }, laptop: { label: 'Workstation', type: 'desk' },
  refrigerator: { label: 'Refrigerator', type: 'cabinet' }, microwave: { label: 'Appliance', type: 'cabinet' },
  oven: { label: 'Appliance', type: 'cabinet' }, sink: { label: 'Sink / fixture', type: 'counter' },
  toilet: { label: 'Fixture', type: 'cabinet' }, 'potted plant': { label: 'Plant', type: 'plant' },
  clock: { label: 'Wall fixture', type: 'display' }, book: { label: 'Shelving contents', type: 'cabinet' },
  vase: { label: 'Decor', type: 'plant' }, person: null, // people are ignored in scans
};

/* Detect objects in the current video frame → [{label, type, conf, x, y, w, h}] (percent coords) */
export async function detectObjects(videoEl) {
  if (!videoEl || !videoEl.videoWidth) return [];
  const model = await loadDetector();
  const preds = await model.detect(videoEl, 8, 0.45);
  const vw = videoEl.videoWidth, vh = videoEl.videoHeight;
  return preds.map(p => {
    const m = COCO_MAP[p.class];
    if (m === null) return null;
    const [bx, by, bw, bh] = p.bbox;
    return {
      label: (m && m.label) || p.class,
      type: (m && m.type) || 'cabinet',
      conf: Math.round(p.score * 100),
      x: (bx / vw) * 100, y: (by / vh) * 100, w: (bw / vw) * 100, h: (bh / vh) * 100,
    };
  }).filter(Boolean);
}

/* ADE20k ids for architectural surfaces */
const SURFACES = { 1: 'wall', 4: 'floor', 6: 'ceiling', 15: 'door', 9: 'window' };

/* Segment the frame → coverage per surface {wall: %, floor: %, ceiling: %, door: %, window: %} */
export async function segmentSurfaces(videoEl) {
  if (!videoEl || !videoEl.videoWidth) return null;
  const model = await loadSegmenter();
  const { legend, segmentationMap, width, height } = await model.segment(videoEl);
  const counts = {};
  // segmentationMap is RGBA; recover class via legend colors
  const colorToName = {};
  Object.entries(legend).forEach(([name, rgb]) => { colorToName[rgb.join(',')] = name.toLowerCase(); });
  const total = width * height;
  for (let i = 0; i < segmentationMap.length; i += 4) {
    const key = `${segmentationMap[i]},${segmentationMap[i + 1]},${segmentationMap[i + 2]}`;
    const name = colorToName[key];
    if (name) counts[name] = (counts[name] || 0) + 1;
  }
  const out = {};
  ['wall', 'floor', 'ceiling', 'door', 'window', 'windowpane'].forEach(n => {
    if (counts[n]) out[n === 'windowpane' ? 'window' : n] = Math.round((counts[n] / total) * 100);
  });
  return out;
}

export function depthCapability() {
  return new Promise(resolve => {
    if (navigator.xr && navigator.xr.isSessionSupported) {
      navigator.xr.isSessionSupported('immersive-ar').then(
        ok => resolve(ok ? 'ar-depth' : 'photogrammetry'),
        () => resolve('photogrammetry'));
    } else resolve('photogrammetry');
  });
}

window.__shieldVision = { detectObjects, segmentSurfaces, depthCapability };
