"""
Synthetic meeting audio generator.
Generates an audio waveform WAV file with frequency shifts simulating spoken speech for testing and demos.
"""
import math
import struct
import wave
from pathlib import Path


def generate_speech_like_wav(output_path: Path, duration_seconds: int = 10):
    sample_rate = 16000
    total_samples = sample_rate * duration_seconds
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with wave.open(str(output_path), "w") as wav_file:
        wav_file.setnchannels(1)  # Mono
        wav_file.setsampwidth(2)  # 16-bit
        wav_file.setframerate(sample_rate)

        data = bytearray()
        for i in range(total_samples):
            t = float(i) / sample_rate
            # Modulate base speech frequencies (120Hz - 800Hz formants)
            freq = 200.0 + 80.0 * math.sin(2.0 * math.pi * 0.5 * t) + 50.0 * math.sin(2.0 * math.pi * 3.0 * t)
            # Add rhythmic envelope mimicking sentences and pauses
            envelope = max(0.0, math.sin(2.0 * math.pi * 0.8 * t)) * (0.5 + 0.5 * math.sin(2.0 * math.pi * 0.2 * t))
            sample_val = int(32767.0 * 0.4 * envelope * math.sin(2.0 * math.pi * freq * t))
            # Clip
            sample_val = max(-32768, min(32767, sample_val))
            data.extend(struct.pack("<h", sample_val))

        wav_file.writeframes(data)
    print(f"Generated test audio ({duration_seconds}s) at: {output_path}")


if __name__ == "__main__":
    base_dir = Path(__file__).resolve().parent
    generate_speech_like_wav(base_dir / "sample_meeting.wav", duration_seconds=12)
    storage_dir = base_dir.parent / "storage" / "audio"
    generate_speech_like_wav(storage_dir / "q3_architecture_sync.mp3", duration_seconds=12)
