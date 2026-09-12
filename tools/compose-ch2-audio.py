"""SOURCE ZERO 210X: original Chapter 2 score and procedural sound design.

Run with Python 3 + NumPy. No recordings, soundfonts, outside music, or sampled
performances are used. The authored motifs below drive a string/amp model and
procedural drum kit. Tails and short room reflections wrap around each score,
so the PCM WAV files loop without encoder padding, silence, or a crossfade dip.
"""
from pathlib import Path
import json
import wave
import numpy as np

RATE = 44100
OUT = Path(__file__).resolve().parents[1] / 'city' / 'assets'
RNG = np.random.default_rng(21000911)
REPORT = {}


def band_noise(n, low, high):
    noise = RNG.standard_normal(n)
    f = np.fft.rfftfreq(n, 1 / RATE)
    shape = (f / np.maximum(f + low, 1)) ** 2 / (1 + (f / high) ** 8)
    y = np.fft.irfft(np.fft.rfft(noise) * shape, n=n)
    return y / max(np.std(y), .00001)


def gate(t, length, release=.045, attack=.003):
    return np.minimum(t / attack, 1) * np.clip((length - t) / release, 0, 1)


def cabinet(y):
    f = np.fft.rfftfreq(len(y), 1 / RATE)
    # Speaker low/high rolloffs and broad cone/presence resonances remove the
    # brittle synth edge from the saturated string signal.
    response = (f / np.maximum(f + 75, 1)) / (1 + (f / 4700) ** 8)
    response *= .62 + .52 * np.exp(-((f - 780) / 650) ** 2) + .35 * np.exp(-((f - 2150) / 850) ** 2)
    return np.fft.irfft(np.fft.rfft(y) * response, n=len(y))


def guitar(pitch, duration, lead=False, detune=0, mute=False):
    length = duration + (.085 if lead else .045)
    t = np.arange(round(length * RATE)) / RATE
    freq = 440 * 2 ** ((pitch - 69 + detune) / 12)
    vibrato = .018 * np.sin(2 * np.pi * 5.4 * t) * np.minimum(t * 6, 1) if lead else 0
    phase = 2 * np.pi * np.cumsum(freq * 2 ** ((vibrato + .065 * np.exp(-t * 80)) / 12) * np.ones_like(t)) / RATE
    y = np.zeros_like(t)
    for k in range(1, min(44, int(14500 / freq))):
        # Plucked steel-string partials; upper partials decay more quickly.
        strength = np.sin(k * np.pi * .217) / (k ** 1.08)
        y += strength * np.sin(k * phase + .023 * k) * np.exp(-t * (1.25 + k * .19 + (9 if mute else 0)))
    y += band_noise(len(t), 1400, 6800) * .034 * np.exp(-t * 190)
    y = np.tanh(y * (5.0 if lead else 6.5)) * (.9 if lead else .82)
    y = cabinet(y)
    return y * gate(t, length, .045 if not lead else .08)


def bass(pitch, duration):
    t = np.arange(round((duration + .05) * RATE)) / RATE
    p = 2 * np.pi * 440 * 2 ** ((pitch - 69) / 12) * t
    y = np.sin(p) + .3 * np.sin(2 * p) * np.exp(-t * 3) + .12 * np.sin(3 * p) * np.exp(-t * 7)
    return np.tanh(y * 1.3) * np.exp(-t * .6) * gate(t, duration + .05)


def drum(kind):
    length = {'kick':.36, 'snare':.29, 'hat':.10, 'open':.36, 'crash':1.75, 'metal':.24, 'tom':.42}[kind]
    t = np.arange(round(length * RATE)) / RATE
    if kind == 'kick':
        phase = 2 * np.pi * (49 * t + 92 * .018 * (1 - np.exp(-t / .018)))
        y = np.sin(phase) * np.exp(-t * 14) + band_noise(len(t), 2100, 8000) * .10 * np.exp(-t * 160)
    elif kind == 'snare':
        y = band_noise(len(t), 600, 10500) * .43 * np.exp(-t * 21)
        y += (.58 * np.sin(2 * np.pi * 186 * t) + .19 * np.sin(2 * np.pi * 327 * t)) * np.exp(-t * 25)
    elif kind in ('hat', 'open', 'crash'):
        decay = {'hat':53, 'open':13, 'crash':3.1}[kind]
        y = band_noise(len(t), 5200 if kind != 'crash' else 2200, 15000) * .24
        for f in (3413, 4597, 6187, 8123):
            y += np.sin(2 * np.pi * f * t + .7 * np.sin(2 * np.pi * 47 * t)) * .025
        y *= np.exp(-t * decay)
    elif kind == 'metal':
        y = sum(np.sin(2 * np.pi * f * t) * a for f, a in [(681,.25),(1219,.2),(1903,.12),(3299,.08)]) * np.exp(-t * 24)
        y += band_noise(len(t), 1000, 8500) * .09 * np.exp(-t * 90)
    else:
        phase = 2 * np.pi * (116 * t + 57 * .035 * (1 - np.exp(-t / .035)))
        y = np.sin(phase) * np.exp(-t * 12) + band_noise(len(t), 550, 3500) * .05 * np.exp(-t * 38)
    return y * gate(t, length, .016, .0015)


class Score:
    def __init__(self, bpm, bars, name):
        self.bpm, self.bars, self.name = bpm, bars, name
        self.spb = 60 / bpm
        self.mix = np.zeros((round(bars * 4 * self.spb * RATE), 2), dtype=np.float64)
        self.events = []

    def add(self, y, beat, gain, pan=0):
        offset = round(beat * self.spb * RATE) % len(self.mix)
        stereo = y[:, None] * gain * np.array([np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)])
        first = min(len(y), len(self.mix) - offset)
        self.mix[offset:offset + first] += stereo[:first]
        if first < len(y):
            self.mix[:len(y) - first] += stereo[first:]

    def note(self, beat, pitch, duration, gain=.20, lead=False, mute=False):
        self.events.append({'beat':beat, 'pitch':pitch, 'length':duration, 'part':'lead' if lead else 'rhythm'})
        if lead:
            self.add(guitar(pitch, duration * self.spb, True), beat, gain, .05)
            self.add(guitar(pitch, duration * self.spb, True, .035), beat + .032, gain * .28, -.46)
        else:
            for pan, delay, detune in [(-.68,0,-.028),(.68,.021,.031)]:
                chord = guitar(pitch, duration * self.spb, detune=detune, mute=mute)
                chord += guitar(pitch + 7, duration * self.spb, detune=detune, mute=mute) * .62
                self.add(chord, beat + delay, gain, pan)

    def low(self, beat, pitch, duration, gain=.26):
        self.add(bass(pitch, duration * self.spb), beat, gain)

    def hit(self, beat, kind, gain, pan=0):
        self.add(drum(kind), beat, gain, pan)

    def render(self):
        # Circular reflections retain cymbal/guitar tails across the loop seam.
        dry = self.mix.copy()
        for seconds, level in [(.047,.055),(.083,.045),(.137,.032),(.229,.023)]:
            self.mix += np.roll(dry[:, ::-1], round(seconds * RATE), axis=0) * level
        self.mix -= np.mean(self.mix, axis=0)
        self.mix = np.tanh(self.mix * 1.05)
        self.mix *= .89 / max(np.max(np.abs(self.mix)), .001)
        # Remove a sub-millisecond boundary jump without removing the ongoing
        # decay/first downbeat. This is a continuity correction, not a fadeout.
        width = 96
        boundary = (self.mix[-1] + self.mix[0]) / 2
        self.mix[:width] += (boundary - self.mix[0]) * np.linspace(1, 0, width)[:, None]
        self.mix[-width:] += (boundary - self.mix[-1]) * np.linspace(0, 1, width)[:, None]
        write(self.name, self.mix, bpm=self.bpm, bars=self.bars, events=len(self.events))
        return self.events


def write(name, samples, **metadata):
    samples = np.asarray(samples)
    if samples.ndim == 1:
        samples = np.column_stack([samples, samples])
    pcm = np.round(np.clip(samples, -.999, .999) * 32767).astype('<i2')
    with wave.open(str(OUT / (name + '.wav')), 'wb') as wav:
        wav.setnchannels(2)
        wav.setsampwidth(2)
        wav.setframerate(RATE)
        wav.writeframes(pcm.tobytes())
    REPORT[name] = {**metadata, 'sampleRate':RATE, 'channels':2, 'duration':len(samples) / RATE,
                   'peak':float(np.max(np.abs(samples))), 'rms':float(np.sqrt(np.mean(samples ** 2))),
                   'boundaryDelta':float(np.max(np.abs(samples[-1] - samples[0])))}


def factory():
    s = Score(126, 32, 'ch2_drone_factory_theme')
    # C-sharp pedal, uneasy side-step and open fourth, with no victory cadence.
    roots = [37,37,40,37,37,42,38,37] * 4
    cell = [(0,0,.31),(.75,0,.18),(1.25,7,.28),(2,0,.34),(2.75,3,.19),(3.5,2,.26)]
    for bar, root in enumerate(roots):
        base = bar * 4
        for beat, interval, length in cell:
            if 16 <= bar < 24 and beat == 1.25:
                continue
            s.note(base + beat, root + interval, length, .145 if bar < 16 or bar >= 24 else .12, mute=interval == 0)
        if bar % 4 == 3:
            s.note(base + 3.75, root + 7, .17, .11, mute=True)
        for beat in (0, .75, 2, 2.75, 3.5):
            s.low(base + beat, root - 12, .35, .235)
        for beat in (0, 2):
            s.hit(base + beat, 'kick', .55)
        if bar % 2 == 1:
            s.hit(base + 2.75, 'kick', .27)
        for beat in (1, 3):
            s.hit(base + beat, 'snare', .32)
        for step in range(8):
            kind = 'open' if step == 7 and bar % 4 == 3 else 'hat'
            s.hit(base + step / 2, kind, .31 if step % 2 == 0 else .23, .25)
        for beat in (.75, 2.25, 3.5):
            s.hit(base + beat, 'metal', .19 if beat == 2.25 else .13, -.36)
        if bar % 8 == 0:
            s.hit(base, 'crash', .24, -.3)
        # Muted machinery pulse, pitched to the pedal, below the guitar hook.
        for beat in (1.5, 3.25):
            t = np.arange(round(.17 * RATE)) / RATE
            pulse = np.sin(2 * np.pi * 69.2957 * t + 2.2 * np.sin(2 * np.pi * 138.5914 * t)) * np.exp(-t * 28) * gate(t, .17)
            s.add(pulse, base + beat, .035, -.25)
        if bar in (7,15,23,31):
            s.hit(base + 3.25, 'tom', .22)
        if bar % 8 in (4,5):
            t = np.arange(round(s.spb * 3.8 * RATE)) / RATE
            f = 440 * 2 ** ((root + 19 - 69) / 12)
            pad = (np.sin(2 * np.pi * f * t) + .25 * np.sin(2 * np.pi * f * 2.004 * t)) * gate(t, len(t) / RATE, .45, .4)
            s.add(pad, base, .031, .4)
    return s.render()


def argus():
    s = Score(168, 48, 'ch2_argus_battle_theme')
    # Original angular D-centred hook. Its leap up a sixth and displaced
    # descending answer are carried by the guitar, never a vacant vocal part.
    hook = [
        [(0,74,.40),(.5,69,.32),(1.25,73,.24),(1.75,78,.62),(2.5,76,.35),(3,74,.78)],
        [(0,81,.70),(.75,78,.42),(1.5,76,.33),(2,73,.70),(3,71,.33),(3.5,69,.35)],
        [(0,74,.30),(.5,78,.65),(1.5,81,.34),(2,83,.66),(3,81,.30),(3.5,78,.38)],
        [(0,76,.85),(1,73,.35),(1.5,74,.35),(2.25,71,.31),(2.75,69,.35),(3.5,73,.36)],
    ]
    driving = [
        [(0,66,.34),(.5,69,.30),(1.25,73,.28),(2,71,.62),(3,69,.72)],
        [(0,71,.65),(1,74,.34),(1.5,73,.32),(2.5,69,.63),(3.5,66,.32)],
        [(0,67,.38),(.75,71,.31),(1.5,74,.66),(2.5,76,.34),(3,74,.68)],
        [(0,73,.60),(1,69,.35),(1.5,66,.30),(2,64,.77),(3,69,.35),(3.5,73,.36)],
    ]
    chorus = [
        [(0,81,.9),(1,78,.34),(1.5,81,.35),(2,85,.8),(3,83,.35),(3.5,81,.38)],
        [(0,78,1.25),(1.5,76,.33),(2,74,.62),(3,78,.80)],
        [(0,83,.85),(1,81,.33),(1.5,78,.35),(2.25,76,.65),(3,74,.74)],
        [(0,76,.60),(.75,73,.33),(1.5,69,.30),(2,73,.38),(2.5,76,.35),(3,78,.70)],
    ]
    progression = [38,47,43,40,36,45,42,40]
    for bar in range(48):
        base, root = bar * 4, progression[bar % 8]
        bridge = 32 <= bar < 40
        for beat in (0,.5,1,1.75,2,2.5,3,3.5):
            if bridge and beat in (.5,1.75,2.5):
                continue
            s.note(base + beat, root, .29 if beat % 1 else .39, .14 if bridge else .175, mute=beat % 1 != 0)
            s.low(base + beat, root - 12, .35, .265)
        phrase = hook if bar < 8 or bar >= 40 else driving if bar < 16 else chorus if bar < 32 else driving
        for beat, pitch, length in phrase[bar % 4]:
            s.note(base + beat, pitch - (12 if bridge else 0), length, .175 if bridge else .225, lead=True)
        for beat in (0,1.5,2,2.75):
            if bridge and beat in (1.5,2.75):
                continue
            s.hit(base + beat, 'kick', .62)
        for beat in (1,3):
            s.hit(base + beat, 'snare', .48)
        for step in range(8):
            s.hit(base + step / 2, 'open' if step == 7 else 'hat', .34 if step % 2 == 0 else .26, .2)
        if bar % 4 == 0 or (16 <= bar < 32 and bar % 2 == 0):
            s.hit(base, 'crash', .43, -.32)
        if bar % 8 == 7:
            for i, beat in enumerate((2.75,3.25,3.5,3.75)):
                s.hit(base + beat, 'tom', .34 + i * .015, -.35 + i * .22)
        if bar % 8 == 6:
            for beat, pitch in [(3,81),(3.25,83),(3.5,85),(3.75,88)]:
                s.note(base + beat, pitch, .18, .10, lead=True)
        if 16 <= bar < 32:
            t = np.arange(round(s.spb * 1.8 * RATE)) / RATE
            f = 440 * 2 ** ((root + 24 - 69) / 12)
            shimmer = (np.sin(2 * np.pi * f * t) + .22 * np.sin(2 * np.pi * f * 3 * t)) * gate(t, len(t) / RATE, .2, .03)
            s.add(shimmer, base, .025, -.2)
    return s.render()


def effects():
    # Smooth dual-tone alarm with a 0.55-second sweep. Modulation and carrier
    # complete integer cycles at the 2.2-second boundary for click-free looping.
    length = 2.2
    t = np.arange(round(length * RATE)) / RATE
    sweep = (1 - np.cos(2 * np.pi * t / .55)) / 2
    frequency = 590 + 420 * sweep
    phase = 2 * np.pi * np.cumsum(frequency) / RATE
    siren = np.sin(phase) + .17 * np.sin(2 * phase) + .075 * np.sin(3 * phase)
    siren *= .34
    n = 96
    edge = (siren[0] + siren[-1]) / 2
    siren[:n] += (edge - siren[0]) * np.linspace(1,0,n)
    siren[-n:] += (edge - siren[-1]) * np.linspace(0,1,n)
    write('argus-security-alarm', siren)
    t = np.arange(round(1.2 * RATE)) / RATE
    roar = band_noise(len(t), 120, 4300) * .11
    roar += np.sin(2 * np.pi * 135 * t + 2 * np.sin(2 * np.pi * 20 * t)) * .085
    roar += np.sin(2 * np.pi * 1240 * t + .35 * np.sin(2 * np.pi * 45 * t)) * .045
    roar *= .82 + .18 * np.sin(2 * np.pi * 25 * t)
    edge = (roar[0] + roar[-1]) / 2
    roar[:n] += (edge - roar[0]) * np.linspace(1,0,n)
    roar[-n:] += (edge - roar[-1]) * np.linspace(0,1,n)
    write('argus-blue-boosters', roar)
    t = np.arange(round(.62 * RATE)) / RATE
    impact = .54 * np.sin(2 * np.pi * (73 * t + 95 * .015 * (1 - np.exp(-t / .015)))) * np.exp(-t * 18)
    impact += band_noise(len(t), 500, 6200) * .15 * np.exp(-t * 37)
    impact += np.sin(2 * np.pi * 640 * t) * .085 * np.exp(-np.maximum(t - .11,0) * 25) * (t > .11)
    impact *= gate(t, .62, .025, .0015)
    write('argus-stabilize', impact)


if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    score = {'factory':factory(), 'argus':argus()}
    effects()
    (Path(__file__).with_name('ch2-audio-verification.json')).write_text(json.dumps(REPORT, indent=2) + '\n')
    print(json.dumps(REPORT, indent=2))
