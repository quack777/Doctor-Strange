export function createHands(onPoint, onNoHand) {
  const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
  });

  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.6
  });

  hands.onResults((results) => {
    const landmarks = results.multiHandLandmarks;
    if (landmarks && landmarks.length > 0) {
      const indexTip = landmarks[0][8];
      onPoint(indexTip);
    } else {
      onNoHand();
    }
  });

  return hands;
}
