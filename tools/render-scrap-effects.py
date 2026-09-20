"""Original 44.1 kHz stereo launch, explosive impact and structural breach SFX."""
from pathlib import Path
import wave
import numpy as np

RATE = 44100
OUT = Path(__file__).resolve().parents[1] / 'city/assets'
rng = np.random.default_rng(210)

def noise(n, low, high):
    f = np.fft.rfftfreq(n, 1 / RATE)
    spectrum = np.fft.rfft(rng.normal(0, 1, n))
    spectrum *= np.minimum(1, (f / max(1, low)) ** 3) / (1 + (f / high) ** 6)
    x = np.fft.irfft(spectrum, n)
    return x / max(.001, np.std(x))

def render(name, duration, kind):
    t = np.arange(round(duration * RATE)) / RATE
    if kind == 'launch':
        envelope = (1 - np.exp(-t * 380)) * np.exp(-t * 11)
        body = .48 * noise(len(t), 500, 7600) * envelope
        body += .22 * np.sin(2 * np.pi * (1100 * t - 800 * t*t)) * envelope
        body += .25 * noise(len(t), 70, 430) * np.exp(-t * 36)
    else:
        envelope = (1 - np.exp(-t * 1000)) * np.exp(-t * (5 if kind == 'impact' else 3.4))
        body = .44 * noise(len(t), 25, 1600) * envelope
        body += .28 * np.sin(2 * np.pi * (48*t + 6*(1-np.exp(-t*22)))) * envelope
        body += .11 * noise(len(t), 1400, 9500) * np.exp(-t * 15)
        if kind == 'breach':
            for delay, pitch in [(.16, 620), (.25, 830), (.37, 470), (.51, 1100)]:
                u = np.maximum(0, t-delay)
                body += .10 * np.sin(2*np.pi*pitch*u) * np.exp(-u*14) * (t>=delay)
            body += .11 * noise(len(t), 300, 5500) * (1-np.exp(-t*8)) * np.exp(-t*3)
    # Early reflections give the impacts a hangar space without masking attacks.
    left, right = body.copy(), body.copy()
    for delay, level in [(.031,.16),(.073,.10),(.127,.06)]:
        samples = round(delay * RATE)
        left[samples:] += body[:-samples] * level
        offset = samples + 173
        right[offset:] += body[:-offset] * level
    stereo = np.column_stack([left,right])
    edge = np.minimum(1,t/.004) * np.minimum(1,(duration-t)/.04)
    stereo *= edge[:,None]
    stereo *= .88 / max(.001,np.max(np.abs(stereo)))
    with wave.open(str(OUT/name),'wb') as out:
        out.setparams((2,2,RATE,0,'NONE','not compressed'))
        out.writeframes((stereo*32767).astype('<i2').tobytes())

render('scrap-missile-launch.wav', .38, 'launch')
render('scrap-missile-explosion.wav', .85, 'impact')
render('scrap-wall-breach.wav', 1.6, 'breach')
