"""Fairmont Junction — The City Is a Machine (original 108 BPM composition).

Python 3 + NumPy. All audio is original physical/modal synthesis: no imported
music, soundfonts, copyrighted recordings, rock instruments, or drum-kit loops.
The score is 84 measures of 4/4; all releases/reflections wrap into bar one.
"""
from collections import Counter
from functools import lru_cache
from pathlib import Path
import json
import wave
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
RATE, BPM, BARS = 44100, 108, 84
BEAT = 60 / BPM
N = round(BARS * 4 * BEAT * RATE)
RNG = np.random.default_rng(210091201)
MIX = np.zeros((N, 2), np.float32)
COUNTS = Counter()


def hz(note):
    return 440 * 2 ** ((note - 69) / 12)


def gate(t, duration, attack=.003, release=.03):
    return np.minimum(t / attack, 1) * np.clip((duration-t)/release, 0, 1)


def noise(n, lo, hi):
    y = RNG.standard_normal(n)
    f = np.fft.rfftfreq(n, 1/RATE)
    response = (f / np.maximum(f+lo, 1)) ** 2 / (1+(f/hi) ** 8)
    y = np.fft.irfft(np.fft.rfft(y)*response, n=n)
    return y/max(np.std(y), .0001)


def resonator(t, fundamental, modes, decay):
    return sum(amp*np.sin(2*np.pi*fundamental*ratio*t+.13*i)
               * np.exp(-t*decay*(1+i*.26))
               for i, (ratio, amp) in enumerate(modes))


def put(y, beat, gain, pan=0, label='sound'):
    # Constant-power panning; small timing deviations are composed into each
    # machinery part rather than randomizing the underlying 108 BPM clock.
    angle = (pan+1)*np.pi/4
    y = np.asarray(y, np.float32)
    start = round(beat*BEAT*RATE) % N
    amount = min(len(y), N-start)
    stereo = y[:, None] * (gain*np.array([np.cos(angle),np.sin(angle)]))
    MIX[start:start+amount] += stereo[:amount]
    if amount < len(y):
        MIX[:len(y)-amount] += stereo[amount:]
    COUNTS[label] += 1


@lru_cache(maxsize=256)
def machine(kind, variant=0, pitch=50):
    duration = dict(press=1.5,steel=1.7,container=2.1,clamp=.5,relay=.16,
                    chain=.55,pneumatic=.95,conveyor=.32,scrape=.9,sheet=2.7)[kind]
    t = np.arange(round(duration*RATE))/RATE
    v = 1+(variant-1)*.025
    if kind == 'press':
        # Hydraulic body, heavy moving steel, and the pressure release after it
        # lands. Several resonant surfaces replace a conventional bass drum.
        phase = 2*np.pi*(43*v*t+32*.032*(1-np.exp(-t/.032)))
        y = .72*np.sin(phase)*np.exp(-t*5)
        y += resonator(t, 102*v, [(1,.36),(2.37,.24),(3.86,.13),(7.13,.09)], 6)
        y += .12*noise(len(t),250,3400)*np.exp(-t*25)
        y += .08*noise(len(t),2400,8000)*np.maximum(t-.11,0)*np.exp(-t*9)
    elif kind in ('steel','container','sheet'):
        base = (hz(pitch)*2 if kind == 'steel' else 74 if kind == 'container' else 421)*v
        modes = [(1,.43),(1.413,.28),(2.17,.22),(2.793,.17),(3.853,.11),(5.17,.08),(7.113,.04)]
        y = resonator(t,base,modes,2.6 if kind == 'sheet' else 3.7)
        y += .19*noise(len(t),200 if kind == 'container' else 900,11500)*np.exp(-t*17)
        if kind == 'container':
            y += .42*np.sin(2*np.pi*57*t)*np.exp(-t*5)
            # Two locking latches follow the body of the freight container.
            for offset in (.083,.146):
                local=np.maximum(0,t-offset)
                y += .10*np.sin(2*np.pi*1171*local)*np.exp(-local*55)*(t>=offset)
        if kind == 'sheet':
            y += .16*noise(len(t),1300,13000)*np.exp(-t*2.7)
    elif kind == 'clamp':
        y = resonator(t,276*v,[(1,.35),(2.83,.2),(5.71,.11)],17)
        y += .12*noise(len(t),600,5200)*np.exp(-t*48)
    elif kind == 'relay':
        y = .13*noise(len(t),2100,11500)*np.exp(-t*85)
        y += resonator(t,1740*v,[(1,.16),(1.73,.08)],75)
    elif kind == 'chain':
        y = np.zeros_like(t)
        for offset,level in [(0,1),(.032,.77),(.070,.52),(.115,.36),(.175,.16)]:
            local=np.maximum(0,t-offset)
            y += level*resonator(local,830*v,[(1,.18),(1.63,.12),(2.76,.07),(4.31,.04)],55)*(t>=offset)
        y += .025*noise(len(t),1900,9000)*np.exp(-t*10)
    elif kind == 'pneumatic':
        pressure = (1-np.exp(-t*26))*np.exp(-t*6)
        y = .33*noise(len(t),2100,10500)*pressure
        y += .04*np.sin(2*np.pi*(530*t+130*t*t))*pressure
    elif kind == 'conveyor':
        y = .19*np.sin(2*np.pi*153*v*t)*np.exp(-t*24)
        y += resonator(t,625*v,[(1,.08),(2.76,.05)],36)
        y += .035*noise(len(t),500,4500)*np.exp(-t*35)
    else:
        y = .18*noise(len(t),420,7600)*(1-np.exp(-t*24))*np.exp(-t*4.2)
        y *= .6+.4*np.sin(2*np.pi*19*t)**2
        y += .05*np.sin(2*np.pi*780*v*t)*np.exp(-t*4)
    return (y*gate(t,duration,attack=.0018,release=.035)).astype(np.float32)


@lru_cache(maxsize=128)
def horn(note, length=2.5):
    duration=length+.85
    t=np.arange(round(duration*RATE))/RATE
    # Stable industrial air-horn voicing, with breath and bore resonances.
    # No siren sweeps, emergency patterns, or melodic pitch dives.
    phase=2*np.pi*hz(note)*t
    y=np.zeros_like(t)
    for k in range(1,18):
        strength=(1+.6*np.exp(-((k*hz(note)-580)/260)**2))/k**1.2
        y += strength*np.sin(k*phase+.018*np.sin(2*np.pi*.73*t)*k)
    y=np.tanh(y*1.4)*.43+.026*noise(len(t),280,2400)
    y *= gate(t,duration,.085,.85)*(1+.035*np.sin(2*np.pi*7.3*t))
    # Distant factories reflect off concrete fronts several blocks apart.
    out=np.pad(y,(0,round(.65*RATE)))
    for delay,level in [(.193,.20),(.387,.12),(.623,.065)]:
        shift=round(delay*RATE);out[shift:shift+len(y)] += y*level
    return out.astype(np.float32)


@lru_cache(maxsize=128)
def note_sound(kind,note,beats):
    duration=beats*BEAT+.45
    t=np.arange(round(duration*RATE))/RATE
    p=2*np.pi*hz(note)*t
    if kind=='bass':
        y=(.68*np.sin(p)+.2*np.sin(2*p)+.06*np.sin(3*p))*(.9+.1*np.exp(-t*3))
        attack,release=.025,.32
    elif kind=='lead':
        y=(np.sin(p+.9*np.sin(2*p)*np.exp(-t*2))+.16*np.sin(3*p))*np.exp(-t*.8)*.55
        attack,release=.009,.4
    elif kind=='keys':
        y=(np.sin(p)+.25*np.sin(2.005*p)*np.exp(-t*3)+.09*np.sin(4.09*p))*np.exp(-t*1.25)*.48
        attack,release=.012,.45
    else:
        y=(np.sin(p)+.22*np.sin(p*2.003)+.14*np.sin(p*3.009))*np.exp(-t*5)*.35
        attack,release=.002,.2
    return (y*gate(t,duration,attack,release)).astype(np.float32)


def machine_bed(root,bar):
    duration=8*BEAT+.28
    t=np.arange(round(duration*RATE))/RATE
    p=2*np.pi*hz(root-12)*t
    # Root-tuned generator with harmonics of its rotating blades. Rotor cycles
    # interlock over two measures; the stereo machinery continuously moves.
    y=(.23*np.sin(p)+.14*np.sin(2*p)+.085*np.sin(3*p))
    y *= .77+.15*np.sin(2*np.pi*t/(2*BEAT))+.08*np.cos(2*np.pi*t/(8*BEAT))
    fan=noise(len(t),180,1900)*(.055+.016*np.sin(2*np.pi*t/BEAT))
    y += fan
    y *= gate(t,duration,.045,.28)
    put(y,bar*4,.40, -.65 if bar%4==0 else .65,'generator / ventilation')
    # A more distant motor occupies the opposite side, quietly breathing.
    put(y,bar*4+.17,.13,.7 if bar%4==0 else -.7,'distant rotating motor')


def score():
    # Root positions follow a restrained D-modal four-chord cycle. The last
    # phrase stays on D to return naturally to the opening machinery cycle.
    roots=[38,36,34,31]
    for bar in range(BARS):
        root=roots[(bar//4)%4] if bar<80 else 38
        density=(.72 if bar<8 else .86 if bar<20 else 1 if bar<34 else
                 .59 if bar<45 else .95 if bar<63 else 1.12 if bar<75 else
                 max(.72,1.03-(bar-75)*.042))
        if bar%2==0:machine_bed(root,bar)
        # Distinct machines perform each quarter-note role, not a drum kit.
        for beat,gain in [(0,.63),(2,.56)]:
            put(machine('press',bar%3),bar*4+beat,gain*density,-.17,'hydraulic press')
        for beat,kind,pan in [(1,'steel',.38),(3,'container',-.38)]:
            put(machine(kind,bar%3,root+12),bar*4+beat+.016,(.37 if kind=='steel' else .34)*density,pan,'steel / freight locking')
        for step in range(8):
            offset=[0,.011,-.012,.009][step%4]
            put(machine('conveyor',step%3),bar*4+step*.5+offset,.20*density,-.69,'conveyor carriage')
            if step%2 or density>=.9:
                put(machine('relay',step%3),bar*4+step*.5+.23,.19*density,.65,'synchronized relays')
        if density>=.72:
            for beat in [1.5,3.5]:put(machine('chain',bar%3),bar*4+beat-.025,.22*density,.78,'chain drive')
            put(machine('clamp',bar%3),bar*4+.75,.29*density,-.50,'mechanical clamp')
        if bar%2==1:
            put(machine('pneumatic',bar%3),bar*4+2.75,.29*density,.38,'pressure exhaust')
        if density>=.95:
            for beat in [.5,2.5]:put(machine('steel',(bar+1)%3,root+19),bar*4+beat+.014,.13,-.28,'pitched pipe response')
            put(machine('scrape',bar%3),bar*4+3.125,.15,-.82,'loading carriage scrape')
        if bar%8==7 and density>.7:
            put(machine('sheet',bar%3,root+12),bar*4+3.5,.20,.30,'sheet-metal punctuation')
        # Steady root/fifth resonance; no sub drops or club kick patterns.
        put(note_sound('bass',root,2.9),bar*4,.34,-.06,'motor bass')
        if bar>=8 and density>=.72:put(note_sound('bass',root+7,.65),bar*4+3,.20,.08,'motor bass')
        if bar%4==0:
            voicing=[root+24,root+31,root+38]
            for i,pitch in enumerate(voicing):
                put(note_sound('keys',pitch,4.5),bar*4+i*.045,.135,[-.34,.23,.48][i],'dark electric keys')
        # Sparse horns signal routine freight movement. Root/fifth punctuation
        # uses long breaths from different sites rather than an alarm rhythm.
        if bar in [0,12,24,32,38,44,52,60,66,72,80]:
            put(horn(root+12,2.8 if bar in [0,38,66] else 1.8),bar*4+.07,.24,-.72,'distant freight horn')
        if bar in [16,28,40,48,56,64,70,76]:
            put(horn(root+19,1.7),bar*4+1.5,.20,.77,'answering factory horn')
        if bar in [32,66,72]:
            put(horn(root+19,2.3),bar*4+.11,.12,.53,'two-factory harmony')
        # Two original 7-note, four-measure fragments alternate. The last bar
        # leaves room for the mechanical answer, without a vocal-shaped gap.
        if bar%4==0 and 8<=bar<76:
            phrase=((0,12,1),(2,15,.7),(3.5,19,1.1),(6,17,1.4),(8.5,14,.8),(10,19,1),(12,17,1.4))
            if (bar//4)%2:
                phrase=((.5,19,.8),(2.5,17,1),(4.5,14,1.3),(7,12,1),(9.5,15,.7),(11,14,.8),(12.5,12,1.5))
            for at,interval,length in phrase:
                put(note_sound('lead',root+interval+12,length),bar*4+at,.18 if density>=.7 else .13,.15,'fragmented city motif')
            if density>=.95:
                for at,interval in [(7.5,24),(13.25,19),(14,26)]:
                    put(note_sound('mallet',root+interval,.3),bar*4+at,.17,-.4,'pitched mechanical answer')
        if bar%8==6 and density>=.95:
            for step in range(6):
                put(machine('clamp',step%3),bar*4+2.5+step*.25,.12,.55,'automated latch sequence')
        if bar%8==0: print('Rendered measures',bar+1,'of',BARS,flush=True)


def finish():
    # Quiet circular reflections connect steel, horns and motors to the same
    # open concrete/metal streets while retaining the close rhythmic impacts.
    dry=MIX.copy()
    for delay,level in [(.057,.070),(.113,.060),(.211,.037),(.347,.022),(.569,.011)]:
        MIX[:] += np.roll(dry[:,::-1],round(delay*RATE),axis=0)*level
    del dry
    MIX[:] -= MIX.mean(axis=0)
    MIX[:] = np.tanh(MIX*1.04)
    MIX[:] *= .87/max(np.max(np.abs(MIX)),.001)
    # The circular score is already continuous in arrangement and reverb.
    # A 3 ms endpoint correction removes integer-sample/DC quantization steps.
    boundary=(MIX[0]+MIX[-1])/2
    ramp=np.linspace(1,0,132)[:,None]
    MIX[:132] += (boundary-MIX[0])*ramp
    MIX[-132:] += (boundary-MIX[-1])*ramp[::-1]
    pcm=np.round(MIX*32767).astype('<i2')
    dest=ROOT/'city/assets/fairmont-city-machine.wav'
    with wave.open(str(dest),'wb') as w:
        w.setnchannels(2);w.setsampwidth(2);w.setframerate(RATE);w.writeframes(pcm.tobytes())
    sections=[('Immediate machinery',0,8),('Main city motif',8,20),('Concurrent production',20,34),
              ('Distant-scale section',34,45),('Busy intersection',45,63),('Maximum production',63,75),('Cycle return',75,84)]
    report=dict(title='Fairmont Junction — The City Is a Machine',original=True,bpm=BPM,meter='4/4',bars=BARS,
                sample_rate=RATE,channels=2,duration=N/RATE,
                peak=float(np.max(np.abs(MIX))),rms=float(np.sqrt(np.mean(MIX**2))),
                seam_delta=[int(x) for x in pcm[0].astype(int)-pcm[-1].astype(int)],
                stereo_correlation=float(np.corrcoef(MIX[::40].T)[0,1]),
                events=dict(COUNTS),sections=[dict(name=n,start=a*4*BEAT,end=b*4*BEAT) for n,a,b in sections],
                source='Original NumPy physical/modal synthesis; no external recordings or borrowed music')
    (ROOT/'tools/fairmont-machine-verification.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(report,indent=2))


if __name__=='__main__':
    score()
    finish()
