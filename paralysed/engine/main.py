import cv2
import mediapipe as mp
import asyncio
import websockets
import json
import time

# MediaPipe Task API Initialization
BaseOptions = mp.tasks.BaseOptions
FaceLandmarker = mp.tasks.vision.FaceLandmarker
FaceLandmarkerOptions = mp.tasks.vision.FaceLandmarkerOptions
VisionRunningMode = mp.tasks.vision.RunningMode

options = FaceLandmarkerOptions(
    base_options=BaseOptions(model_asset_path='face_landmarker.task'),
    running_mode=VisionRunningMode.IMAGE,
    num_faces=1,
    min_face_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

# ── WebSocket State ──────────────────────────────────────────────────
CLIENT_CONNECTIONS = set()

# ── Gaze Logic ───────────────────────────────────────────────────────
DWELL_TIME_REQ = 1.0  # 1 second dwell to trigger
current_direction = None
dwell_start_time = None

# ── Mode: "neck" (wider thresholds) or "eye" (tighter thresholds) ───
tracking_mode = "eye"  # default

# Thresholds per mode
MODE_THRESHOLDS = {
    "neck": {"LEFT": 0.42, "RIGHT": 0.58},   # wider — more forgiving
    "eye":  {"LEFT": 0.46, "RIGHT": 0.54},   # tighter — subtle iris shifts
}

# ── Landmark Indices ─────────────────────────────────────────────────
# Left eye
L_IRIS_CENTER = 468
L_INNER_CORNER = 133
L_OUTER_CORNER = 33

# Right eye
R_IRIS_CENTER = 473
R_INNER_CORNER = 362
R_OUTER_CORNER = 263


def get_landmark(landmarks, idx, w, h):
    """Convert normalized MediaPipe landmark to pixel coordinates."""
    lm = landmarks[idx]
    return (int(lm.x * w), int(lm.y * h))


def get_horizontal_ratio(landmarks, frame_w, frame_h):
    """
    Compute horizontal gaze ratio (0.0 = far left, 1.0 = far right).
    Averages both eyes for stability.
    """
    l_iris = get_landmark(landmarks, L_IRIS_CENTER, frame_w, frame_h)
    l_inner = get_landmark(landmarks, L_INNER_CORNER, frame_w, frame_h)
    l_outer = get_landmark(landmarks, L_OUTER_CORNER, frame_w, frame_h)

    r_iris = get_landmark(landmarks, R_IRIS_CENTER, frame_w, frame_h)
    r_inner = get_landmark(landmarks, R_INNER_CORNER, frame_w, frame_h)
    r_outer = get_landmark(landmarks, R_OUTER_CORNER, frame_w, frame_h)

    l_horiz_range = l_inner[0] - l_outer[0]
    r_horiz_range = r_outer[0] - r_inner[0]

    if l_horiz_range == 0 or r_horiz_range == 0:
        return 0.5

    l_horiz_ratio = (l_iris[0] - l_outer[0]) / l_horiz_range
    r_horiz_ratio = (r_iris[0] - r_inner[0]) / r_horiz_range
    return (l_horiz_ratio + r_horiz_ratio) / 2.0


def determine_direction(horiz_ratio):
    """Map horizontal ratio to 'left', 'right', or None (center/dead-zone)."""
    thresholds = MODE_THRESHOLDS.get(tracking_mode, MODE_THRESHOLDS["eye"])

    if horiz_ratio < thresholds["LEFT"]:
        return "left"
    elif horiz_ratio > thresholds["RIGHT"]:
        return "right"
    return None


async def broadcast(message):
    """Send a message to all connected WebSocket clients."""
    if CLIENT_CONNECTIONS:
        tasks = [asyncio.create_task(client.send(message)) for client in CLIENT_CONNECTIONS]
        await asyncio.wait(tasks)


async def handler(websocket, path=None):
    """Handle WebSocket connections. Listen for mode-change messages."""
    global tracking_mode
    CLIENT_CONNECTIONS.add(websocket)
    try:
        async for message in websocket:
            try:
                data = json.loads(message)
                if data.get("set_mode") in ("neck", "eye"):
                    tracking_mode = data["set_mode"]
                    print(f"[MODE] Switched to: {tracking_mode}")
            except json.JSONDecodeError:
                pass
    finally:
        CLIENT_CONNECTIONS.remove(websocket)


async def tracking_loop():
    """Main CV loop: capture frames, detect gaze, broadcast direction."""
    global current_direction, dwell_start_time

    cap = cv2.VideoCapture(0)
    last_broadcast_time = time.time()

    with FaceLandmarker.create_from_options(options) as landmarker:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            frame = cv2.flip(frame, 1)  # mirror
            frame_h, frame_w, _ = frame.shape
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
            results = landmarker.detect(mp_image)

            detected_direction = None

            if results.face_landmarks:
                landmarks = results.face_landmarks[0]
                horiz_ratio = get_horizontal_ratio(landmarks, frame_w, frame_h)
                detected_direction = determine_direction(horiz_ratio)

                # Debug overlay
                thresholds = MODE_THRESHOLDS.get(tracking_mode, MODE_THRESHOLDS["eye"])
                cv2.putText(frame, f"H: {horiz_ratio:.3f}  Mode: {tracking_mode}", (30, 30),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 200, 0), 2)
                if detected_direction:
                    color = (0, 255, 100) if detected_direction == "right" else (100, 100, 255)
                    cv2.putText(frame, detected_direction.upper(), (30, 70),
                                cv2.FONT_HERSHEY_SIMPLEX, 1.2, color, 3)
                else:
                    cv2.putText(frame, "CENTER", (30, 70),
                                cv2.FONT_HERSHEY_SIMPLEX, 1.0, (180, 180, 180), 2)

            now = time.time()

            # ── Dwell Logic ──────────────────────────────────────────
            if detected_direction == current_direction and current_direction is not None:
                elapsed = now - dwell_start_time
                progress = min(100, int((elapsed / DWELL_TIME_REQ) * 100))

                if elapsed >= DWELL_TIME_REQ:
                    # TRIGGER!
                    await broadcast(json.dumps({
                        "triggered": current_direction
                    }))
                    print(f"[TRIGGERED] {current_direction}")
                    dwell_start_time = now
                    progress = 0
                    current_direction = None
                else:
                    if now - last_broadcast_time > 0.04:  # ~25fps updates
                        await broadcast(json.dumps({
                            "hovering": current_direction,
                            "dwell_progress": progress
                        }))
                        last_broadcast_time = now
            else:
                if detected_direction is not None:
                    current_direction = detected_direction
                    dwell_start_time = now
                else:
                    current_direction = None
                    dwell_start_time = None

                if now - last_broadcast_time > 0.04:
                    await broadcast(json.dumps({
                        "hovering": current_direction if current_direction else "none",
                        "dwell_progress": 0
                    }))
                    last_broadcast_time = now

            cv2.imshow("Play Gugglu - Eye Tracker", frame)
            if cv2.waitKey(1) & 0xFF == 27:  # ESC to quit
                break

            await asyncio.sleep(0.01)

    cap.release()
    cv2.destroyAllWindows()


async def main():
    print("=" * 50)
    print("  Play Gugglu CV Engine")
    print("  WebSocket: ws://localhost:8080")
    print("  Dwell Time: 1.0s")
    print("  Mode: eye (default, switchable from frontend)")
    print("=" * 50)
    
    async with websockets.serve(handler, "localhost", 8080):
        await tracking_loop()


if __name__ == "__main__":
    asyncio.run(main())