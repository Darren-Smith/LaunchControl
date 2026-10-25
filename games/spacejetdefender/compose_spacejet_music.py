#!/usr/bin/env python3
"""
compose_spacejet_music.py — Composes adventurous 8-bit synth tracks with a driving beat
for Spacejet Defender using the Tunic8-Bit engine (/home/darren/Documents/AntiGravityProjects/tunic8-bit).

Generates both .t8b song files and pre-rendered .wav files in SpacejetDefender/audio/.
"""

import os
import sys

TUNIC_ROOT = "/home/darren/Documents/AntiGravityProjects/tunic8-bit"
sys.path.insert(0, TUNIC_ROOT)

from tunic8bit import Tunic8BitEngine, T8BSong, T8BTrack, T8BNote, T8BFile


def n(note, octave, duration="e", velocity=1.0):
    return T8BNote(note=note, octave=octave, duration=duration, velocity=velocity)


def rest(duration="e"):
    return T8BNote(note="REST", octave=0, duration=duration, velocity=0.0)


def add_beat_bars(kick_notes, noise_notes, num_bars, style="driving"):
    """
    Appends `num_bars` of 4/4 drum beat to `kick_notes` (low triangle kick/tom punch)
    and `noise_notes` (LFSR noise snare + hi-hat groove).
    Every bar is exactly 4.0 beats.
    """
    for bar in range(num_bars):
        is_fill = (bar % 4 == 3)
        if style == "title":
            # Synthwave mid-tempo beat: Boom (1) - Snare (2) - Boom-Boom (3, 3&) - Snare (4)
            if not is_fill:
                kick_notes.extend([
                    n("C", 2, "e", 1.0), rest("e"),
                    n("G", 1, "e", 0.45), rest("e"),
                    n("C", 2, "e", 0.95), n("C", 2, "e", 0.85),
                    n("G", 1, "e", 0.45), rest("e"),
                ])
                noise_notes.extend([
                    n("C", 5, "e", 0.28), n("C", 5, "e", 0.35),
                    n("C", 3, "e", 0.90), n("C", 5, "e", 0.35),
                    n("C", 5, "e", 0.28), n("C", 5, "e", 0.35),
                    n("C", 3, "e", 0.90), n("C", 5, "e", 0.40),
                ])
            else:
                # Bar 4 tom + snare fill
                kick_notes.extend([
                    n("C", 2, "e", 1.0), rest("e"),
                    n("G", 1, "e", 0.45), n("C", 2, "e", 0.85),
                    n("F", 2, "e", 0.9), n("D", 2, "e", 0.9),
                    n("C", 2, "e", 0.95), n("G", 1, "e", 0.95),
                ])
                noise_notes.extend([
                    n("C", 5, "e", 0.3), n("C", 5, "e", 0.35),
                    n("C", 3, "e", 0.9), n("C", 5, "e", 0.35),
                    n("C", 3, "s", 0.75), n("C", 3, "s", 0.8), n("C", 3, "s", 0.85), n("C", 3, "s", 0.9),
                    n("C", 3, "e", 1.0), n("C", 3, "e", 0.95),
                ])
        elif style == "driving":
            # Upbeat arcade groove with syncopated kick & crisp backbeat
            if not is_fill:
                kick_notes.extend([
                    n("C", 2, "e", 1.0), rest("e"),
                    n("G", 1, "s", 0.4), rest("s"), n("C", 2, "e", 0.85),
                    n("C", 2, "e", 0.95), n("C", 2, "e", 0.8),
                    n("G", 1, "e", 0.45), n("A", 1, "e", 0.75),
                ])
                noise_notes.extend([
                    n("C", 5, "e", 0.30), n("C", 5, "e", 0.38),
                    n("C", 3, "e", 0.92), n("C", 5, "e", 0.38),
                    n("C", 5, "e", 0.30), n("C", 5, "e", 0.38),
                    n("C", 3, "e", 0.92), n("C", 5, "s", 0.35), n("C", 5, "s", 0.42),
                ])
            else:
                kick_notes.extend([
                    n("C", 2, "e", 1.0), n("C", 2, "e", 0.8),
                    n("G", 1, "e", 0.5), n("C", 2, "e", 0.85),
                    n("G", 2, "e", 0.9), n("F", 2, "e", 0.9),
                    n("D", 2, "e", 0.95), n("C", 2, "e", 1.0),
                ])
                noise_notes.extend([
                    n("C", 5, "e", 0.32), n("C", 5, "e", 0.38),
                    n("C", 3, "e", 0.92), n("C", 5, "e", 0.38),
                    n("C", 3, "s", 0.75), n("C", 3, "s", 0.80), n("C", 3, "s", 0.85), n("C", 3, "s", 0.90),
                    n("C", 3, "s", 0.95), n("C", 3, "s", 0.95), n("C", 3, "e", 1.0),
                ])
        elif style == "heavy":
            # Four-on-the-floor industrial synth beat with double-kick pickups
            if not is_fill:
                kick_notes.extend([
                    n("C", 2, "e", 1.0), n("G", 1, "e", 0.65),
                    n("C", 2, "e", 0.9), n("C", 2, "e", 0.8),
                    n("C", 2, "e", 1.0), n("C", 2, "s", 0.8), n("C", 2, "s", 0.85),
                    n("C", 2, "e", 0.9), n("A", 1, "e", 0.8),
                ])
                noise_notes.extend([
                    n("C", 5, "s", 0.32), n("C", 5, "s", 0.25), n("C", 5, "e", 0.38),
                    n("C", 3, "e", 0.95), n("C", 5, "e", 0.40),
                    n("C", 5, "s", 0.32), n("C", 5, "s", 0.25), n("C", 5, "e", 0.38),
                    n("C", 3, "e", 0.95), n("C", 5, "s", 0.38), n("C", 3, "s", 0.65),
                ])
            else:
                kick_notes.extend([
                    n("C", 2, "e", 1.0), n("C", 2, "e", 0.85),
                    n("G", 2, "e", 0.9), n("F", 2, "e", 0.9),
                    n("E", 2, "e", 0.95), n("D", 2, "e", 0.95),
                    n("C", 2, "s", 1.0), n("C", 2, "s", 1.0), n("G", 1, "e", 1.0),
                ])
                noise_notes.extend([
                    n("C", 3, "e", 0.9), n("C", 5, "e", 0.4),
                    n("C", 3, "e", 0.95), n("C", 3, "e", 0.85),
                    n("C", 3, "s", 0.8), n("C", 3, "s", 0.85), n("C", 3, "s", 0.9), n("C", 3, "s", 0.95),
                    n("C", 3, "s", 1.0), n("C", 3, "s", 1.0), n("C", 3, "e", 1.0),
                ])


def add_bass_bar(bass_notes, root, fifth, oct=2, pattern="octave"):
    """Appends 1 bar (4 beats) of rhythmic synth bass."""
    if pattern == "octave":
        bass_notes.extend([
            n(root, oct, "e", 0.95), n(root, oct + 1, "e", 0.80),
            n(root, oct, "e", 0.90), n(fifth, oct, "e", 0.85),
            n(root, oct, "e", 0.95), n(root, oct + 1, "e", 0.85),
            n(fifth, oct, "e", 0.90), n(root, oct + 1, "e", 0.80),
        ])
    elif pattern == "gallop":
        bass_notes.extend([
            n(root, oct, "e", 0.95), n(root, oct, "s", 0.80), n(root, oct + 1, "s", 0.85),
            n(root, oct, "e", 0.90), n(fifth, oct, "e", 0.85),
            n(root, oct, "e", 0.95), n(root, oct, "s", 0.80), n(root, oct + 1, "s", 0.85),
            n(fifth, oct, "e", 0.90), n(root, oct + 1, "e", 0.85),
        ])


def add_harmony_bar(harm_notes, n1, n2, n3, oct=4, rhythm="arp8"):
    """Appends 1 bar (4 beats) of synth chord arpeggio or rhythmic stabs."""
    if rhythm == "arp8":
        seq = [(n1, oct), (n2, oct), (n3, oct), (n1, oct + 1), (n3, oct), (n2, oct), (n1, oct), (n3, oct)]
        for pitch, o in seq:
            harm_notes.append(n(pitch, o, "e", 0.65))
    elif rhythm == "pad_pulse":
        harm_notes.extend([
            n(n1, oct, "q", 0.65), n(n2, oct, "e", 0.60), n(n3, oct, "e", 0.65),
            n(n1, oct + 1, "q", 0.68), n(n3, oct, "q", 0.60),
        ])


# =============================================================================
# 1. TITLE THEME: "Orbital Command Horizon" (122 BPM, A Minor, 16 Bars)
# =============================================================================
def build_title_song():
    song = T8BSong(title="title", author="Spacejet Defender", bpm=122.0)

    lead = []
    harm = []
    bass = []
    kick = []
    drums = []

    chords = [
        ("A", "C", "E", "E"), ("F", "A", "C", "C"), ("C", "E", "G", "G"), ("G", "B", "D", "D"),
        ("A", "C", "E", "E"), ("F", "A", "C", "C"), ("D", "F", "A", "A"), ("E", "G#", "B", "B"),
        ("A", "C", "E", "E"), ("F", "A", "C", "C"), ("C", "E", "G", "G"), ("G", "B", "D", "D"),
        ("F", "A", "C", "C"), ("D", "F", "A", "A"), ("E", "G#", "B", "B"), ("A", "C", "E", "E"),
    ]

    for idx, (r, t, f, fifth) in enumerate(chords):
        add_bass_bar(bass, r, fifth, oct=2, pattern="octave")
        add_harmony_bar(harm, r, t, f, oct=4, rhythm="arp8" if idx >= 4 else "pad_pulse")

    add_beat_bars(kick, drums, 16, style="title")

    # Section A (Bars 1-8): Spacious heroic synth lead
    lead.extend([
        # Bar 1 (Am)
        n("E", 5, "q."), n("A", 5, "e"), n("G", 5, "q"), n("E", 5, "q"),
        # Bar 2 (F)
        n("F", 5, "q."), n("C", 5, "e"), n("A", 4, "h"),
        # Bar 3 (C)
        n("E", 5, "q"), n("G", 5, "q"), n("C", 6, "q."), n("B", 5, "e"),
        # Bar 4 (G)
        n("B", 5, "h."), rest("q"),
        # Bar 5 (Am)
        n("A", 5, "q."), n("B", 5, "e"), n("C", 6, "q"), n("E", 6, "q"),
        # Bar 6 (F)
        n("D", 6, "q."), n("C", 6, "e"), n("A", 5, "h"),
        # Bar 7 (Dm)
        n("F", 5, "q"), n("A", 5, "q"), n("D", 6, "q."), n("C", 6, "e"),
        # Bar 8 (E7)
        n("B", 5, "h."), rest("q"),
        # Bar 9 (Am - Soaring B-Section)
        n("E", 6, "q."), n("D", 6, "e"), n("C", 6, "q"), n("A", 5, "q"),
        # Bar 10 (F)
        n("C", 6, "q."), n("A", 5, "e"), n("F", 5, "h"),
        # Bar 11 (C)
        n("G", 5, "q"), n("C", 6, "q"), n("E", 6, "q."), n("D", 6, "e"),
        # Bar 12 (G)
        n("D", 6, "h"), n("B", 5, "q"), rest("q"),
        # Bar 13 (F)
        n("A", 5, "q"), n("C", 6, "q"), n("F", 6, "q."), n("E", 6, "e"),
        # Bar 14 (Dm)
        n("D", 6, "q."), n("C", 6, "e"), n("A", 5, "h"),
        # Bar 15 (E7)
        n("G#", 5, "q"), n("B", 5, "q"), n("E", 6, "q"), n("D", 6, "q"),
        # Bar 16 (Am)
        n("A", 5, "h."), rest("q"),
    ])

    song.tracks.append(T8BTrack("Synth Lead", "sawtooth", 0, 0.78, 5, 0.5,
                                {"attack": 0.015, "decay": 0.08, "sustain": 0.75, "release": 0.08}, lead))
    song.tracks.append(T8BTrack("Warm Arp Pad", "pulse", 1, 0.52, 4, 0.25,
                                {"attack": 0.01, "decay": 0.05, "sustain": 0.65, "release": 0.05}, harm))
    song.tracks.append(T8BTrack("Synth Bass", "sawtooth", 2, 0.80, 2, 0.5,
                                {"attack": 0.005, "decay": 0.04, "sustain": 0.78, "release": 0.03}, bass))
    song.tracks.append(T8BTrack("Kick Beat", "triangle", 3, 0.95, 2, 0.5,
                                {"attack": 0.002, "decay": 0.05, "sustain": 0.20, "release": 0.02}, kick))
    song.tracks.append(T8BTrack("Drums Snare Hat", "noise", 4, 0.62, 4, 0.5,
                                {"attack": 0.001, "decay": 0.04, "sustain": 0.22, "release": 0.02}, drums))
    return song


# =============================================================================
# 2. CADET THEME (Sectors 1-2): "Starfighter Wings" (134 BPM, C Major / A Minor, 16 Bars)
# =============================================================================
def build_cadet_song():
    song = T8BSong(title="cadet", author="Spacejet Defender", bpm=134.0)

    lead, harm, bass, kick, drums = [], [], [], [], []

    chords = [
        ("C", "E", "G", "G"), ("G", "B", "D", "D"), ("A", "C", "E", "E"), ("F", "A", "C", "C"),
        ("C", "E", "G", "G"), ("G", "B", "D", "D"), ("F", "A", "C", "C"), ("G", "B", "D", "D"),
        ("A", "C", "E", "E"), ("F", "A", "C", "C"), ("C", "E", "G", "G"), ("G", "B", "D", "D"),
        ("D", "F", "A", "A"), ("F", "A", "C", "C"), ("G", "B", "D", "D"), ("C", "E", "G", "G"),
    ]

    for r, t, f, fifth in chords:
        add_bass_bar(bass, r, fifth, oct=2, pattern="octave")
        add_harmony_bar(harm, r, t, f, oct=4, rhythm="arp8")

    add_beat_bars(kick, drums, 16, style="driving")

    lead.extend([
        # Bar 1
        n("C", 5, "q"), n("E", 5, "q"), n("G", 5, "q."), n("A", 5, "e"),
        # Bar 2
        n("G", 5, "q"), n("D", 5, "q"), n("B", 4, "h"),
        # Bar 3
        n("A", 4, "q"), n("C", 5, "q"), n("E", 5, "q."), n("G", 5, "e"),
        # Bar 4
        n("F", 5, "h"), n("A", 5, "q"), rest("q"),
        # Bar 5
        n("G", 5, "q"), n("C", 6, "q"), n("B", 5, "e"), n("A", 5, "e"), n("G", 5, "q"),
        # Bar 6
        n("D", 5, "q"), n("G", 5, "q"), n("B", 5, "h"),
        # Bar 7
        n("A", 5, "q."), n("G", 5, "e"), n("F", 5, "q"), n("A", 5, "q"),
        # Bar 8
        n("G", 5, "h."), rest("q"),
        # Bar 9 (B section)
        n("E", 5, "q"), n("A", 5, "q"), n("C", 6, "q."), n("B", 5, "e"),
        # Bar 10
        n("A", 5, "q"), n("F", 5, "q"), n("C", 5, "h"),
        # Bar 11
        n("E", 5, "q"), n("G", 5, "q"), n("C", 6, "q"), n("E", 6, "q"),
        # Bar 12
        n("D", 6, "h."), rest("q"),
        # Bar 13
        n("D", 6, "q."), n("C", 6, "e"), n("A", 5, "q"), n("F", 5, "q"),
        # Bar 14
        n("A", 5, "q"), n("C", 6, "q"), n("F", 6, "h"),
        # Bar 15
        n("E", 6, "q"), n("D", 6, "q"), n("B", 5, "q"), n("G", 5, "q"),
        # Bar 16
        n("C", 6, "h."), rest("q"),
    ])

    song.tracks.append(T8BTrack("Lead", "pulse", 0, 0.80, 5, 0.5,
                                {"attack": 0.008, "decay": 0.05, "sustain": 0.78, "release": 0.05}, lead))
    song.tracks.append(T8BTrack("Harmony Arp", "sawtooth", 1, 0.48, 4, 0.5,
                                {"attack": 0.008, "decay": 0.04, "sustain": 0.60, "release": 0.04}, harm))
    song.tracks.append(T8BTrack("Bass", "triangle", 2, 0.90, 2, 0.5,
                                {"attack": 0.004, "decay": 0.03, "sustain": 0.85, "release": 0.03}, bass))
    song.tracks.append(T8BTrack("Kick Beat", "triangle", 3, 0.96, 2, 0.5,
                                {"attack": 0.002, "decay": 0.05, "sustain": 0.20, "release": 0.02}, kick))
    song.tracks.append(T8BTrack("Drums", "noise", 4, 0.65, 4, 0.5,
                                {"attack": 0.001, "decay": 0.04, "sustain": 0.22, "release": 0.02}, drums))
    return song


# =============================================================================
# 3. MID CAMPAIGN THEME (Sectors 3, 5, 7): "Vanguard Liberation" (140 BPM, E Minor, 16 Bars)
# =============================================================================
def build_mid_song():
    song = T8BSong(title="mid", author="Spacejet Defender", bpm=140.0)

    lead, harm, bass, kick, drums = [], [], [], [], []

    chords = [
        ("E", "G", "B", "B"), ("C", "E", "G", "G"), ("G", "B", "D", "D"), ("D", "F#", "A", "A"),
        ("E", "G", "B", "B"), ("C", "E", "G", "G"), ("A", "C", "E", "E"), ("B", "D#", "F#", "F#"),
        ("C", "E", "G", "G"), ("G", "B", "D", "D"), ("A", "C", "E", "E"), ("E", "G", "B", "B"),
        ("C", "E", "G", "G"), ("D", "F#", "A", "A"), ("B", "D#", "F#", "F#"), ("E", "G", "B", "B"),
    ]

    for r, t, f, fifth in chords:
        add_bass_bar(bass, r, fifth, oct=2, pattern="gallop")
        add_harmony_bar(harm, r, t, f, oct=4, rhythm="arp8")

    add_beat_bars(kick, drums, 16, style="driving")

    lead.extend([
        # Bar 1 (Em)
        n("E", 5, "q"), n("G", 5, "e"), n("A", 5, "e"), n("B", 5, "q."), n("A", 5, "e"),
        # Bar 2 (C)
        n("G", 5, "q"), n("E", 5, "q"), n("C", 5, "h"),
        # Bar 3 (G)
        n("D", 5, "q"), n("G", 5, "e"), n("A", 5, "e"), n("B", 5, "q"), n("D", 6, "q"),
        # Bar 4 (D)
        n("A", 5, "h."), rest("q"),
        # Bar 5 (Em)
        n("B", 5, "q"), n("E", 6, "q"), n("D", 6, "e"), n("B", 5, "e"), n("G", 5, "q"),
        # Bar 6 (C)
        n("A", 5, "q."), n("G", 5, "e"), n("E", 5, "h"),
        # Bar 7 (Am)
        n("A", 5, "q"), n("B", 5, "q"), n("C", 6, "q."), n("A", 5, "e"),
        # Bar 8 (B7)
        n("B", 5, "h."), rest("q"),
        # Bar 9 (C - Heroic chorus)
        n("C", 6, "q."), n("D", 6, "e"), n("E", 6, "q"), n("G", 6, "q"),
        # Bar 10 (G)
        n("D", 6, "q."), n("B", 5, "e"), n("G", 5, "h"),
        # Bar 11 (Am)
        n("A", 5, "q"), n("C", 6, "q"), n("E", 6, "q."), n("D", 6, "e"),
        # Bar 12 (Em)
        n("B", 5, "h."), rest("q"),
        # Bar 13 (C)
        n("G", 5, "q"), n("C", 6, "q"), n("E", 6, "q."), n("C", 6, "e"),
        # Bar 14 (D)
        n("D", 6, "q"), n("F#", 6, "q"), n("A", 6, "h"),
        # Bar 15 (B7)
        n("F#", 6, "q"), n("D#", 6, "q"), n("B", 5, "q"), n("A", 5, "q"),
        # Bar 16 (Em)
        n("E", 5, "h."), rest("q"),
    ])

    song.tracks.append(T8BTrack("Synth Lead", "sawtooth", 0, 0.80, 5, 0.5,
                                {"attack": 0.01, "decay": 0.05, "sustain": 0.78, "release": 0.05}, lead))
    song.tracks.append(T8BTrack("Pulse Arp", "pulse", 1, 0.52, 4, 0.25,
                                {"attack": 0.005, "decay": 0.04, "sustain": 0.65, "release": 0.04}, harm))
    song.tracks.append(T8BTrack("Driving Bass", "sawtooth", 2, 0.84, 2, 0.5,
                                {"attack": 0.004, "decay": 0.03, "sustain": 0.80, "release": 0.03}, bass))
    song.tracks.append(T8BTrack("Kick Beat", "triangle", 3, 0.96, 2, 0.5,
                                {"attack": 0.002, "decay": 0.05, "sustain": 0.20, "release": 0.02}, kick))
    song.tracks.append(T8BTrack("Drums", "noise", 4, 0.68, 4, 0.5,
                                {"attack": 0.001, "decay": 0.04, "sustain": 0.22, "release": 0.02}, drums))
    return song


# =============================================================================
# 4. HEAVY FORTRESS THEME (Sectors 4, 6, 8, 9): "Tesla Reactor Raid" (146 BPM, D Minor, 16 Bars)
# =============================================================================
def build_heavy_song():
    song = T8BSong(title="heavy", author="Spacejet Defender", bpm=146.0)

    lead, harm, bass, kick, drums = [], [], [], [], []

    chords = [
        ("D", "F", "A", "A"), ("Bb", "D", "F", "F"), ("G", "Bb", "D", "D"), ("A", "C#", "E", "E"),
        ("D", "F", "A", "A"), ("Bb", "D", "F", "F"), ("C", "E", "G", "G"), ("D", "F", "A", "A"),
        ("F", "A", "C", "C"), ("C", "E", "G", "G"), ("G", "Bb", "D", "D"), ("A", "C#", "E", "E"),
        ("Bb", "D", "F", "F"), ("G", "Bb", "D", "D"), ("A", "C#", "E", "E"), ("D", "F", "A", "A"),
    ]

    for r, t, f, fifth in chords:
        add_bass_bar(bass, r, fifth, oct=2, pattern="gallop")
        add_harmony_bar(harm, r, t, f, oct=4, rhythm="arp8")

    add_beat_bars(kick, drums, 16, style="heavy")

    lead.extend([
        # Bar 1 (Dm)
        n("D", 5, "q"), n("F", 5, "e"), n("G", 5, "e"), n("A", 5, "q"), n("D", 6, "q"),
        # Bar 2 (Bb)
        n("C", 6, "q."), n("Bb", 5, "e"), n("A", 5, "h"),
        # Bar 3 (Gm)
        n("G", 5, "q"), n("Bb", 5, "q"), n("D", 6, "q."), n("C", 6, "e"),
        # Bar 4 (A7)
        n("C#", 6, "h"), n("A", 5, "q"), rest("q"),
        # Bar 5 (Dm)
        n("D", 6, "q."), n("A", 5, "e"), n("F", 5, "q"), n("D", 5, "q"),
        # Bar 6 (Bb)
        n("F", 5, "q"), n("Bb", 5, "q"), n("D", 6, "h"),
        # Bar 7 (C)
        n("E", 6, "q"), n("C", 6, "q"), n("G", 5, "q"), n("E", 6, "q"),
        # Bar 8 (Dm)
        n("D", 6, "h."), rest("q"),
        # Bar 9 (F)
        n("F", 6, "q."), n("C", 6, "e"), n("A", 5, "q"), n("F", 5, "q"),
        # Bar 10 (C)
        n("E", 6, "q."), n("C", 6, "e"), n("G", 5, "h"),
        # Bar 11 (Gm)
        n("Bb", 5, "q"), n("D", 6, "q"), n("G", 6, "q."), n("F", 6, "e"),
        # Bar 12 (A7)
        n("E", 6, "h."), rest("q"),
        # Bar 13 (Bb)
        n("D", 6, "q"), n("Bb", 5, "q"), n("F", 5, "q"), n("Bb", 5, "q"),
        # Bar 14 (Gm)
        n("G", 5, "q"), n("Bb", 5, "q"), n("D", 6, "h"),
        # Bar 15 (A7)
        n("C#", 6, "q"), n("E", 6, "q"), n("A", 5, "q"), n("C#", 6, "q"),
        # Bar 16 (Dm)
        n("D", 6, "h."), rest("q"),
    ])

    song.tracks.append(T8BTrack("Lead", "sawtooth", 0, 0.82, 5, 0.5,
                                {"attack": 0.008, "decay": 0.04, "sustain": 0.78, "release": 0.04}, lead))
    song.tracks.append(T8BTrack("Arp", "pulse", 1, 0.54, 4, 0.25,
                                {"attack": 0.004, "decay": 0.03, "sustain": 0.65, "release": 0.03}, harm))
    song.tracks.append(T8BTrack("Sub Bass", "sawtooth", 2, 0.86, 2, 0.5,
                                {"attack": 0.003, "decay": 0.03, "sustain": 0.82, "release": 0.03}, bass))
    song.tracks.append(T8BTrack("Kick Beat", "triangle", 3, 0.98, 2, 0.5,
                                {"attack": 0.002, "decay": 0.05, "sustain": 0.22, "release": 0.02}, kick))
    song.tracks.append(T8BTrack("Drums", "noise", 4, 0.70, 4, 0.5,
                                {"attack": 0.001, "decay": 0.04, "sustain": 0.24, "release": 0.02}, drums))
    return song


# =============================================================================
# 5. FINAL BOSS THEME (Sector 10): "Alien King's UFO Palace" (152 BPM, C Minor, 16 Bars)
# =============================================================================
def build_boss_song():
    song = T8BSong(title="boss", author="Spacejet Defender", bpm=152.0)

    lead, harm, bass, kick, drums = [], [], [], [], []

    chords = [
        ("C", "Eb", "G", "G"), ("Ab", "C", "Eb", "Eb"), ("Fm", "Ab", "C", "C"), ("G", "B", "D", "D"),
        ("C", "Eb", "G", "G"), ("Ab", "C", "Eb", "Eb"), ("Bb", "D", "F", "F"), ("G", "B", "D", "D"),
        ("Eb", "G", "Bb", "Bb"), ("Bb", "D", "F", "F"), ("Ab", "C", "Eb", "Eb"), ("G", "B", "D", "D"),
        ("F", "Ab", "C", "C"), ("Ab", "C", "Eb", "Eb"), ("G", "B", "D", "D"), ("C", "Eb", "G", "G"),
    ]

    for r, t, f, fifth in chords:
        root_clean = "F" if r == "Fm" else r
        add_bass_bar(bass, root_clean, fifth, oct=2, pattern="gallop")
        add_harmony_bar(harm, root_clean, t, f, oct=4, rhythm="arp8")

    add_beat_bars(kick, drums, 16, style="heavy")

    lead.extend([
        # Bar 1 (Cm)
        n("C", 6, "q"), n("G", 5, "e"), n("Eb", 5, "e"), n("C", 5, "q"), n("G", 5, "q"),
        # Bar 2 (Ab)
        n("Ab", 5, "q."), n("G", 5, "e"), n("Eb", 5, "h"),
        # Bar 3 (Fm)
        n("F", 5, "q"), n("Ab", 5, "q"), n("C", 6, "q."), n("D", 6, "e"),
        # Bar 4 (G7)
        n("B", 5, "h"), n("G", 5, "q"), rest("q"),
        # Bar 5 (Cm)
        n("C", 6, "q"), n("D", 6, "e"), n("Eb", 6, "e"), n("G", 6, "q"), n("Eb", 6, "q"),
        # Bar 6 (Ab)
        n("C", 6, "q."), n("Ab", 5, "e"), n("Eb", 5, "h"),
        # Bar 7 (Bb)
        n("Bb", 5, "q"), n("D", 6, "q"), n("F", 6, "q."), n("Eb", 6, "e"),
        # Bar 8 (G7)
        n("D", 6, "h."), rest("q"),
        # Bar 9 (Eb)
        n("Eb", 6, "q."), n("Bb", 5, "e"), n("G", 5, "q"), n("Eb", 6, "q"),
        # Bar 10 (Bb)
        n("D", 6, "q."), n("Bb", 5, "e"), n("F", 5, "h"),
        # Bar 11 (Ab)
        n("C", 6, "q"), n("Eb", 6, "q"), n("Ab", 6, "q."), n("G", 6, "e"),
        # Bar 12 (G7)
        n("G", 6, "h"), n("D", 6, "q"), rest("q"),
        # Bar 13 (Fm)
        n("F", 6, "q"), n("C", 6, "q"), n("Ab", 5, "q"), n("F", 5, "q"),
        # Bar 14 (Ab)
        n("Eb", 6, "q"), n("C", 6, "q"), n("Ab", 5, "h"),
        # Bar 15 (G7)
        n("G", 5, "q"), n("B", 5, "q"), n("D", 6, "q"), n("F", 6, "q"),
        # Bar 16 (Cm)
        n("C", 6, "h."), rest("q"),
    ])

    song.tracks.append(T8BTrack("Boss Lead", "sawtooth", 0, 0.84, 5, 0.5,
                                {"attack": 0.006, "decay": 0.04, "sustain": 0.80, "release": 0.04}, lead))
    song.tracks.append(T8BTrack("Boss Arp", "pulse", 1, 0.56, 4, 0.25,
                                {"attack": 0.004, "decay": 0.03, "sustain": 0.65, "release": 0.03}, harm))
    song.tracks.append(T8BTrack("Boss Bass", "sawtooth", 2, 0.88, 2, 0.5,
                                {"attack": 0.003, "decay": 0.03, "sustain": 0.85, "release": 0.03}, bass))
    song.tracks.append(T8BTrack("Kick Beat", "triangle", 3, 1.0, 2, 0.5,
                                {"attack": 0.002, "decay": 0.05, "sustain": 0.22, "release": 0.02}, kick))
    song.tracks.append(T8BTrack("Drums", "noise", 4, 0.72, 4, 0.5,
                                {"attack": 0.001, "decay": 0.04, "sustain": 0.25, "release": 0.02}, drums))
    return song


# =============================================================================
# 6. VICTORY FANFARE: "Admiral of Earth" (128 BPM, C Major, 8 Bars)
# =============================================================================
def build_victory_song():
    song = T8BSong(title="victory", author="Spacejet Defender", bpm=128.0)

    lead, harm, bass, kick, drums = [], [], [], [], []

    chords = [
        ("C", "E", "G", "G"), ("F", "A", "C", "C"), ("G", "B", "D", "D"), ("C", "E", "G", "G"),
        ("A", "C", "E", "E"), ("F", "A", "C", "C"), ("G", "B", "D", "D"), ("C", "E", "G", "G"),
    ]

    for r, t, f, fifth in chords:
        add_bass_bar(bass, r, fifth, oct=2, pattern="octave")
        add_harmony_bar(harm, r, t, f, oct=4, rhythm="pad_pulse")

    add_beat_bars(kick, drums, 8, style="title")

    lead.extend([
        n("C", 5, "q"), n("E", 5, "q"), n("G", 5, "q"), n("C", 6, "q"),
        n("A", 5, "q."), n("C", 6, "e"), n("F", 6, "h"),
        n("E", 6, "q"), n("D", 6, "q"), n("B", 5, "q"), n("G", 5, "q"),
        n("C", 6, "h."), rest("q"),
        n("E", 6, "q."), n("C", 6, "e"), n("A", 5, "q"), n("E", 5, "q"),
        n("F", 5, "q"), n("A", 5, "q"), n("C", 6, "q"), n("F", 6, "q"),
        n("E", 6, "q"), n("D", 6, "q"), n("B", 5, "q"), n("D", 6, "q"),
        n("C", 6, "h."), rest("q"),
    ])

    song.tracks.append(T8BTrack("Victory Lead", "sawtooth", 0, 0.82, 5, 0.5,
                                {"attack": 0.01, "decay": 0.05, "sustain": 0.80, "release": 0.06}, lead))
    song.tracks.append(T8BTrack("Victory Chords", "pulse", 1, 0.55, 4, 0.5,
                                {"attack": 0.01, "decay": 0.05, "sustain": 0.70, "release": 0.05}, harm))
    song.tracks.append(T8BTrack("Victory Bass", "triangle", 2, 0.88, 2, 0.5,
                                {"attack": 0.005, "decay": 0.04, "sustain": 0.82, "release": 0.04}, bass))
    song.tracks.append(T8BTrack("Kick Beat", "triangle", 3, 0.95, 2, 0.5,
                                {"attack": 0.002, "decay": 0.05, "sustain": 0.20, "release": 0.02}, kick))
    song.tracks.append(T8BTrack("Drums", "noise", 4, 0.62, 4, 0.5,
                                {"attack": 0.001, "decay": 0.04, "sustain": 0.22, "release": 0.02}, drums))
    return song


def main():
    audio_out_dir = "/home/darren/Documents/AntiGravityProjects/SpacejetDefender/audio"
    t8b_out_dir = "/home/darren/Documents/AntiGravityProjects/SpacejetDefender/audio/t8b"
    os.makedirs(audio_out_dir, exist_ok=True)
    os.makedirs(t8b_out_dir, exist_ok=True)

    engine = Tunic8BitEngine(verbose=True)

    builders = [
        build_title_song,
        build_cadet_song,
        build_mid_song,
        build_heavy_song,
        build_boss_song,
        build_victory_song,
    ]

    for build_fn in builders:
        song = build_fn()
        t8b_path = os.path.join(t8b_out_dir, f"spacejet_{song.title}.t8b")
        T8BFile.save(song, t8b_path)
        wav_path = os.path.join(audio_out_dir, f"{song.title}.wav")
        engine.export_wav(song, wav_path)


if __name__ == "__main__":
    main()
