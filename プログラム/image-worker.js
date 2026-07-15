self.addEventListener("message", (event) => {
  const { type, payload } = event.data || {};
  if (type !== "analyze" || !payload || !payload.pixels) {
    return;
  }

  const { pixels, width, height } = payload;
  const pixelCount = Math.min(
    Number.isFinite(width * height) ? width * height : 0,
    Math.floor(pixels.length / 4)
  );
  if (!Number.isFinite(pixelCount) || pixelCount <= 0) {
    self.postMessage({
      type: "analysis-error",
      payload: { message: "有効な画像ピクセルがありません。" },
    });
    return;
  }

  const step = Math.max(1, Math.floor(pixelCount / 12000));

  let rTotal = 0;
  let gTotal = 0;
  let bTotal = 0;
  let brightnessTotal = 0;
  let sampleCount = 0;

  for (let i = 0; i < pixelCount * 4; i += 4 * step) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    rTotal += r;
    gTotal += g;
    bTotal += b;
    brightnessTotal += 0.299 * r + 0.587 * g + 0.114 * b;
    sampleCount += 1;
  }
  if (sampleCount <= 0) {
    self.postMessage({
      type: "analysis-error",
      payload: { message: "画像解析サンプルを取得できませんでした。" },
    });
    return;
  }

  const rAvg = Math.round(rTotal / sampleCount);
  const gAvg = Math.round(gTotal / sampleCount);
  const bAvg = Math.round(bTotal / sampleCount);
  const brightness = Math.round(brightnessTotal / sampleCount);

  const tone = brightness >= 140 ? "bright" : brightness <= 80 ? "dark" : "mid";
  const temperature = rAvg > bAvg ? "warm" : "cool";

  self.postMessage({
    type: "analysis-result",
    payload: {
      averageColor: `rgb(${rAvg}, ${gAvg}, ${bAvg})`,
      brightness,
      tone,
      temperature,
      samples: sampleCount,
    },
  });
});
