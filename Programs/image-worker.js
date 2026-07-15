self.addEventListener("message", (event) => {
  const { type, payload } = event.data || {};
  if (type !== "analyze" || !payload || !payload.pixels) {
    return;
  }

  const { pixels, width, height } = payload;
  const step = Math.max(1, Math.floor((width * height) / 12000));

  let rTotal = 0;
  let gTotal = 0;
  let bTotal = 0;
  let brightnessTotal = 0;
  let sampleCount = 0;

  for (let i = 0; i < pixels.length; i += 4 * step) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    rTotal += r;
    gTotal += g;
    bTotal += b;
    brightnessTotal += 0.299 * r + 0.587 * g + 0.114 * b;
    sampleCount += 1;
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
