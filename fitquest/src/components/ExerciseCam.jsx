import { useEffect, useRef, useState } from "react";
import { createPose, makeCounter, EXERCISES } from "../lib/pose";

export default function ExerciseCam({ type, onFinish }) {
  const videoRef = useRef(null);
  const [info, setInfo] = useState({ reps: 0, visible: false, angle: null, stage: "up" });
  const [status, setStatus] = useState("Loading AI model...");

  useEffect(() => {
    let raf, stream, stopped = false, lastTime = -1;
    const counter = makeCounter(EXERCISES[type]);

    (async () => {
      try {
        const pose = await createPose();
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 640, height: 480 },
          audio: false,
        });
        if (stopped) { stream.getTracks().forEach((t) => t.stop()); return; }
        const v = videoRef.current;
        v.srcObject = stream;
        await v.play();
        setStatus("");

        const loop = () => {
          if (stopped) return;
          if (v.currentTime !== lastTime) {
            lastTime = v.currentTime;
            const res = pose.detectForVideo(v, performance.now());
            if (res.landmarks?.[0]) setInfo(counter(res.landmarks[0]));
            else setInfo((p) => ({ ...p, visible: false }));
          }
          raf = requestAnimationFrame(loop);
        };
        loop();
      } catch (e) {
        setStatus("Camera or model error: " + e.message);
      }
    })();

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [type]);

  return (
    <div>
      <video ref={videoRef} playsInline muted className="cam" />
      {status && <p>{status}</p>}
      <h1 className="big">{info.reps} reps</h1>
      {!info.visible && !status && <p className="warn">Move back so your full body is visible</p>}
      <p className="small">angle: {info.angle ?? "-"} | stage: {info.stage}</p>
      <button className="primary" onClick={() => onFinish(info.reps)}>Finish and save</button>
    </div>
  );
}