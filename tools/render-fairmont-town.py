"""Render the supplied Fairmont score, not a replacement composition.

Python + NumPy only. Note timing, pitches, velocities, CC volume/pan and the
LOOP_START/LOOP_END boundaries come from the original MIDI. The README's GM
percussion placeholders are rendered as procedural mechanical instruments.
"""
from collections import Counter
from hashlib import sha256
from pathlib import Path
import json
import struct
import wave
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'city/assets/Fairmont_Junction_Industrial_Town_Theme.mid'
DEST = ROOT / 'city/assets/fairmont-junction-industrial-town.wav'
RATE = 44100
RNG = np.random.default_rng(82052)


def vlq(data, pos):
    value = 0
    for _ in range(4):
        b = data[pos]; pos += 1
        value = value * 128 + (b & 127)
        if b < 128:
            return value, pos
    raise ValueError('Invalid MIDI VLQ')


def read_score():
    raw = SOURCE.read_bytes()
    assert raw[:4] == b'MThd'
    fmt, count, ppq = struct.unpack('>HHH', raw[8:14])
    assert fmt == 1 and not ppq & 0x8000
    pos = 8 + int.from_bytes(raw[4:8], 'big')
    tracks, markers, tempos = [], {}, []
    for _ in range(count):
        assert raw[pos:pos+4] == b'MTrk'
        size = int.from_bytes(raw[pos+4:pos+8], 'big')
        data = raw[pos+8:pos+8+size]; pos += size + 8
        at = tick = 0; running = None; active = {}; notes = []
        name = ''; program = 0; volume = 100; pan = 64; controls = set()
        while at < len(data):
            delta, at = vlq(data, at); tick += delta
            status = data[at]
            if status >= 128:
                at += 1; running = status if status < 240 else None
            else:
                assert running is not None
                status = running
            if status == 255:
                kind = data[at]; size, at = vlq(data, at+1)
                payload = data[at:at+size]; at += size
                if kind == 3: name = payload.decode('utf-8')
                if kind == 6: markers[payload.decode('utf-8')] = tick
                if kind == 81: tempos.append((tick, int.from_bytes(payload, 'big')))
            elif status in (240, 247):
                size, at = vlq(data, at); at += size
            else:
                kind, channel = status >> 4, status & 15
                size = 1 if kind in (12, 13) else 2
                values = data[at:at+size]; at += size
                if kind == 12: program = values[0]
                elif kind == 11:
                    controls.add(values[0])
                    if values[0] == 7: volume = values[1]
                    elif values[0] == 10: pan = values[1]
                    else: assert values[0] in (91, 93, 121, 123), 'Unsupported performance controller'
                elif kind == 9 and values[1]:
                    key = (channel, values[0]); assert key not in active
                    active[key] = (tick, values[1], volume, pan)
                elif kind in (8, 9):
                    start, velocity, vol, position = active.pop((channel, values[0]))
                    notes.append((start, tick-start, values[0], velocity, channel, vol, position))
                else:
                    raise ValueError('Unsupported performance event '+str(kind))
        assert not active, 'Unreleased MIDI notes'
        tracks.append(dict(name=name, program=program, notes=notes, controls=sorted(controls)))
    assert len(set(t for _, t in tempos)) == 1 and tempos[0][0] == 0
    tempo = tempos[0][1]
    assert abs(60000000 / tempo - 82) < .001
    assert markers['LOOP_START'] == 0 and markers['LOOP_END'] == 52 * 4 * ppq
    return tracks, markers, tempo / 1e6 / ppq, ppq


def envelope(t, duration, attack, release):
    return np.minimum(t / attack, 1) * np.clip((duration + release - t) / release, 0, 1)


def tone(part, note, duration):
    release = [1.1, .65, 1.1, .12, .18, 1.8][part]
    t = np.arange(round((duration + release) * RATE)) / RATE
    p = 2 * np.pi * 440 * 2 ** ((note - 69) / 12) * t
    if part == 0:  # Slow, warm pad with a restrained chorus.
        y = (.48*np.sin(p)+.22*np.sin(p*1.0018)+.22*np.sin(p*.9982)+.09*np.sin(2*p))
        attack = .28
    elif part == 1:  # Soft tine electric piano.
        y = np.sin(p + 1.35*np.sin(2*p)*np.exp(-t*5)) * np.exp(-t*.9)
        y += .13*np.sin(3*p)*np.exp(-t*5); attack = .008
    elif part == 2:  # Rounded, clearly pitched mallet/bell lead.
        y = (np.sin(p)*np.exp(-t*1.5)+.23*np.sin(2.003*p)*np.exp(-t*3)
             +.10*np.sin(4.01*p)*np.exp(-t*6)); attack = .006
    elif part == 3:
        y = np.sin(p)+.16*np.sin(2*p)*np.exp(-t*2); attack = .018
    elif part == 4:
        y = (np.sin(p)+.25*np.sin(2*p)+.1*np.sin(3*p))*np.exp(-t*8); attack = .004
    else:
        y = (.6*np.sin(p)+.22*np.sin(p*1.002)+.1*np.sin(2*p))*(.85+.15*np.sin(2*np.pi*.37*t))
        attack = .6
    return y * envelope(t, duration, attack, release)


PERCUSSION = {41:'machine press / piston',53:'light steel strike',68:'pipe clank',
              76:'relay click',77:'gear click',58:'pneumatic release',
              36:'soft low reinforcement',51:'distant metal resonance',56:'pipe strike',42:'muted metallic hi-hat'}


def mechanical(note):
    assert note in PERCUSSION, 'Unmapped percussion '+str(note)
    length = {41:.65,53:.7,68:.45,76:.09,77:.12,58:.85,36:.4,51:1.7,56:.55,42:.10}[note]
    t = np.arange(round(length*RATE))/RATE
    noise = RNG.standard_normal(len(t))
    if note in (41,36):
        p = 2*np.pi*((45 if note == 36 else 61)*t+35*.025*(1-np.exp(-t/.025)))
        y = np.sin(p)*np.exp(-t*11)+.10*noise*np.exp(-t*65)
        if note == 41: y += .14*np.sin(2*np.pi*341*t)*np.exp(-t*25)
    elif note == 42:
        y = .18*(noise-np.roll(noise,1))*np.exp(-t*58)
    elif note == 58:
        y = .32*(noise-np.roll(noise,1))*(1-np.exp(-t*32))*np.exp(-t*5)
    else:
        base = {53:1337,68:487,76:1760,77:1210,51:813,56:693}[note]
        decay = {53:8,68:13,76:65,77:48,51:2.8,56:11}[note]
        y = sum(a*np.sin(2*np.pi*base*r*t)*np.exp(-t*decay*(1+i*.3))
                for i,(r,a) in enumerate([(1,.5),(1.437,.25),(2.731,.13),(4.113,.05)]))
        y += .07*noise*np.exp(-t*100)
    return y * envelope(t, length-.015, .0015, .015)


def main():
    tracks, markers, seconds_per_tick, ppq = read_score()
    n = round(markers['LOOP_END'] * seconds_per_tick * RATE)
    mix = np.zeros((n,2),dtype=np.float64)
    parts = [t for t in tracks if t['notes']]
    assert len(parts) == 7
    gains = [.18,.23,.28,.30,.16,.10,.28]
    used = Counter()
    for part, track in enumerate(parts):
        print(track['name'], 'program',track['program'], 'notes',len(track['notes']), flush=True)
        for start, ticks, pitch, velocity, channel, volume, pan in track['notes']:
            y = mechanical(pitch) if channel == 9 else tone(part,pitch,ticks*seconds_per_tick)
            if channel == 9: used[pitch] += 1
            gain = gains[part]*(velocity/100)*(volume/100)
            angle = pan/127*np.pi/2
            stereo = y[:,None]*gain*np.array([np.cos(angle),np.sin(angle)])
            offset = round(start*seconds_per_tick*RATE)%n
            first = min(len(y),n-offset)
            mix[offset:offset+first] += stereo[:first]
            if first < len(y): mix[:len(y)-first] += stereo[first:]
    # Circular room reflections preserve final-bar releases into bar one.
    dry = mix.copy()
    for delay, gain in [(.079,.10),(.137,.075),(.263,.045),(.431,.025)]:
        mix += np.roll(dry[:,::-1],round(delay*RATE),axis=0)*gain
    mix -= mix.mean(axis=0)
    mix *= .83 / max(np.max(np.abs(mix)),.001)
    boundary = (mix[0]+mix[-1])/2
    mix[:96] += (boundary-mix[0])*np.linspace(1,0,96)[:,None]
    mix[-96:] += (boundary-mix[-1])*np.linspace(0,1,96)[:,None]
    pcm = np.round(mix*32767).astype('<i2')
    with wave.open(str(DEST),'wb') as out:
        out.setnchannels(2); out.setsampwidth(2); out.setframerate(RATE); out.writeframes(pcm.tobytes())
    report = dict(source_sha256=sha256(SOURCE.read_bytes()).hexdigest(),duration=n/RATE,
                  sample_rate=RATE,bpm=82,bars=52,markers=markers,ppq=ppq,
                  peak=float(np.max(np.abs(mix))),rms=float(np.sqrt(np.mean(mix**2))),
                  seam_delta=[int(x) for x in pcm[0].astype(int)-pcm[-1].astype(int)],
                  percussion={str(k):dict(sound=PERCUSSION[k],hits=v) for k,v in used.items()},
                  tracks=[dict(name=t['name'],program=t['program'],notes=len(t['notes'])) for t in parts])
    (ROOT/'tools/fairmont-town-verification.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))


if __name__ == '__main__':
    main()
