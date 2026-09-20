"""Original stereo rushing-water effect, 44.1 kHz PCM. No external samples.

Filtered turbulence, a low pressure surge and short bubbling/spray bursts.
The crest peaks at frame 16 / 18 FPS; soft edges prevent onset/ending clicks.
"""
from pathlib import Path
import wave
import numpy as np

RATE=44100
DURATION=20/18
IMPACT=16/18
RNG=np.random.default_rng(210019)
t=np.arange(round(RATE*DURATION))/RATE

def noise(low,high):
    raw=RNG.normal(size=len(t));f=np.fft.rfftfreq(len(t),1/RATE)
    shape=(f/np.maximum(f+low,1))**2/(1+(f/high)**6)
    y=np.fft.irfft(np.fft.rfft(raw)*shape,n=len(t))
    return y/max(np.std(y),1e-8)

channels=[]
for side in [-1,1]:
    rise=np.clip(t/IMPACT,0,1)**1.3
    crest=np.exp(-((t-IMPACT)/.075)**2)
    body=noise(70,700)*(.1+.19*rise+.18*crest)
    surf=noise(550,4400)*(.04+.22*rise+.31*crest)
    spray=noise(2200,11000)*(.012+.07*rise+.16*crest)
    pressure=np.sin(2*np.pi*(53*t-12*t*t))*.14*crest
    bubbles=np.zeros_like(t)
    for start,freq in zip(RNG.uniform(.20,1.02,20),RNG.uniform(180,1500,20)):
        u=np.maximum(0,t-start);envelope=(t>=start)*np.exp(-u/.018)
        bubbles+=.016*np.sin(2*np.pi*(freq*u-800*u*u))*envelope
    motion=1+side*.12*np.sin(2*np.pi*t*.7)
    envelope=np.minimum(t/.035,1)*np.clip((DURATION-t)/.16,0,1)
    channels.append((body+surf+spray+pressure+bubbles)*envelope*motion)
pcm=np.stack(channels,axis=1)
pcm=np.tanh(pcm*.85);pcm*=.87/np.max(np.abs(pcm))
pcm[[0,-1],:]=0
out=Path(__file__).resolve().parents[1]/'city/assets/tidal-wave-rush.wav'
with wave.open(str(out),'wb') as f:
    f.setnchannels(2);f.setsampwidth(2);f.setframerate(RATE);f.writeframes((pcm*32767).astype('<i2').tobytes())
print(f'{out.name}: {len(t)/RATE:.3f}s, stereo {RATE}Hz, peak {np.max(np.abs(pcm)):.3f}, edge samples zero')
