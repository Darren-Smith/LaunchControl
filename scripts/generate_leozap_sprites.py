#!/usr/bin/env python3
"""Generate missing sprites for LeoZap:
- slow_fly.png (34x34 scaled up for crispness: 128x128)
- fast_fly.png (28x28 scaled up: 128x128)
- alien_king.png (96x96 scaled up: 256x256)
- space_cow.png (80x52 scaled up: 256x166)
- blob_alien.png (200x140 scaled up: 400x280)
- power_up.png (128x128)
"""
from pathlib import Path
from PIL import Image, ImageDraw

IMG_DIR = Path(__file__).resolve().parent.parent / "games" / "leozap" / "static" / "assets" / "images"

def make_slow_fly():
    # Greenish buzzing fly with wings and big goggles
    im = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    # Wings
    d.ellipse([16, 20, 60, 60], fill=(200, 240, 255, 180), outline=(100, 180, 220, 240), width=3)
    d.ellipse([68, 20, 112, 60], fill=(200, 240, 255, 180), outline=(100, 180, 220, 240), width=3)
    # Body
    d.ellipse([44, 40, 84, 100], fill=(120, 200, 40, 255), outline=(50, 100, 20, 255), width=3)
    # Stripes
    d.arc([46, 55, 82, 70], 0, 180, fill=(40, 80, 10, 255), width=3)
    d.arc([46, 70, 82, 85], 0, 180, fill=(40, 80, 10, 255), width=3)
    # Eyes (goggles)
    d.ellipse([36, 42, 62, 68], fill=(255, 60, 60, 255), outline=(30, 30, 30, 255), width=3)
    d.ellipse([66, 42, 92, 68], fill=(255, 60, 60, 255), outline=(30, 30, 30, 255), width=3)
    d.ellipse([44, 48, 52, 56], fill=(255, 255, 255, 255))
    d.ellipse([74, 48, 82, 56], fill=(255, 255, 255, 255))
    im.save(IMG_DIR / "slow_fly.png")
    print("Created slow_fly.png")

def make_fast_fly():
    # Zippy sleek neon-orange wasp with electric trail
    im = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    # Angled sharp wings
    d.polygon([(64, 45), (10, 15), (35, 65)], fill=(255, 240, 150, 190), outline=(255, 180, 0, 240))
    d.polygon([(64, 45), (118, 15), (93, 65)], fill=(255, 240, 150, 190), outline=(255, 180, 0, 240))
    # Sleek stinger & body
    d.polygon([(64, 115), (48, 55), (80, 55)], fill=(255, 80, 20, 255), outline=(180, 20, 0, 255))
    # Head & visor
    d.ellipse([46, 25, 82, 55], fill=(255, 160, 0, 255), outline=(180, 50, 0, 255), width=3)
    d.ellipse([50, 32, 78, 46], fill=(50, 220, 255, 255), outline=(20, 100, 150, 255), width=2)
    # Stinger tip
    d.polygon([(64, 122), (60, 110), (68, 110)], fill=(255, 230, 0, 255))
    im.save(IMG_DIR / "fast_fly.png")
    print("Created fast_fly.png")

def make_alien_king():
    # Majestic crowned alien with cape & jeweled crown
    im = Image.new("RGBA", (256, 256), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    # Royal purple cape
    d.polygon([(50, 110), (128, 90), (206, 110), (225, 235), (31, 235)], fill=(120, 30, 140, 255), outline=(70, 15, 85, 255), width=4)
    # Cape fur trim
    d.ellipse([40, 220, 216, 245], fill=(245, 240, 230, 255), outline=(180, 170, 160, 255), width=3)
    # Alien Head (teal/cyan)
    d.ellipse([70, 70, 186, 175], fill=(35, 195, 165, 255), outline=(20, 110, 95, 255), width=4)
    # Crown (gold with ruby)
    crown_pts = [(75, 85), (85, 25), (108, 60), (128, 18), (148, 60), (171, 25), (181, 85)]
    d.polygon(crown_pts, fill=(255, 205, 30, 255), outline=(190, 130, 10, 255), width=3)
    d.ellipse([118, 42, 138, 62], fill=(230, 30, 60, 255)) # Ruby
    # Menacing glowing eyes
    d.ellipse([88, 105, 118, 135], fill=(255, 235, 50, 255), outline=(160, 130, 10, 255), width=2)
    d.ellipse([138, 105, 168, 135], fill=(255, 235, 50, 255), outline=(160, 130, 10, 255), width=2)
    d.ellipse([98, 113, 108, 127], fill=(20, 20, 20, 255))
    d.ellipse([148, 113, 158, 127], fill=(20, 20, 20, 255))
    # Grin
    d.arc([105, 135, 151, 158], 15, 165, fill=(15, 75, 60, 255), width=4)
    im.save(IMG_DIR / "alien_king.png")
    print("Created alien_king.png")

def make_space_cow():
    # Humorous space cow in bubble helmet with jetpack and spots
    im = Image.new("RGBA", (256, 166), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    # Jetpack on back
    d.rounded_rectangle([75, 20, 135, 50], radius=8, fill=(180, 180, 190, 255), outline=(100, 100, 110, 255), width=3)
    # Rocket flames
    d.polygon([(60, 28), (75, 24), (75, 46)], fill=(255, 120, 20, 255))
    d.polygon([(52, 33), (65, 30), (65, 40)], fill=(255, 240, 50, 255))
    # Cow body (white)
    d.ellipse([70, 40, 210, 135], fill=(250, 250, 252, 255), outline=(40, 40, 45, 255), width=4)
    # Cow black spots
    d.ellipse([100, 55, 140, 95], fill=(30, 30, 35, 255))
    d.ellipse([160, 75, 195, 115], fill=(30, 30, 35, 255))
    d.ellipse([85, 95, 115, 125], fill=(30, 30, 35, 255))
    # Legs (in tiny space boots)
    d.rectangle([90, 125, 105, 152], fill=(230, 230, 235, 255), outline=(40, 40, 45, 255), width=2)
    d.rectangle([115, 125, 130, 152], fill=(230, 230, 235, 255), outline=(40, 40, 45, 255), width=2)
    d.rectangle([155, 125, 170, 152], fill=(230, 230, 235, 255), outline=(40, 40, 45, 255), width=2)
    d.rectangle([180, 125, 195, 152], fill=(230, 230, 235, 255), outline=(40, 40, 45, 255), width=2)
    d.rounded_rectangle([86, 145, 107, 158], radius=3, fill=(50, 120, 220, 255))
    d.rounded_rectangle([111, 145, 132, 158], radius=3, fill=(50, 120, 220, 255))
    d.rounded_rectangle([151, 145, 172, 158], radius=3, fill=(50, 120, 220, 255))
    d.rounded_rectangle([176, 145, 197, 158], radius=3, fill=(50, 120, 220, 255))
    # Head & Muzzle
    d.ellipse([175, 45, 242, 105], fill=(250, 250, 252, 255), outline=(40, 40, 45, 255), width=3)
    d.ellipse([210, 65, 248, 100], fill=(255, 185, 205, 255), outline=(200, 130, 155, 255), width=2)
    # Nostrils & eye
    d.ellipse([222, 78, 227, 85], fill=(80, 40, 50, 255))
    d.ellipse([234, 78, 239, 85], fill=(80, 40, 50, 255))
    d.ellipse([192, 58, 206, 72], fill=(30, 30, 35, 255))
    d.ellipse([195, 60, 199, 64], fill=(255, 255, 255, 255))
    # Astronaut Glass Helmet
    d.ellipse([160, 25, 254, 120], outline=(120, 200, 255, 220), width=4)
    # Glass glare reflection
    d.arc([168, 33, 246, 112], 200, 260, fill=(255, 255, 255, 200), width=3)
    im.save(IMG_DIR / "space_cow.png")
    print("Created space_cow.png")

def make_blob_alien():
    # Big tanky gelatinous blob alien with glowing core and multiple eyes
    im = Image.new("RGBA", (400, 280), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    # Outer blob silhouette
    blob_pts = [
        (60, 230), (40, 180), (50, 120), (90, 60), (170, 30),
        (250, 25), (320, 50), (360, 110), (370, 180), (345, 235),
        (280, 255), (200, 260), (120, 255)
    ]
    d.polygon(blob_pts, fill=(130, 40, 210, 240), outline=(80, 15, 140, 255))
    # Smooth with overlapping ellipses
    d.ellipse([45, 70, 365, 255], fill=(155, 50, 235, 220))
    d.ellipse([85, 35, 325, 210], fill=(175, 70, 255, 220))
    # Inner glowing slime drops
    d.ellipse([120, 80, 190, 150], fill=(210, 140, 255, 160))
    d.ellipse([220, 100, 290, 170], fill=(210, 140, 255, 160))
    # 3 Googly / Alien Eyes
    # Central Big Eye
    d.ellipse([160, 85, 240, 165], fill=(250, 255, 230, 255), outline=(60, 20, 90, 255), width=4)
    d.ellipse([185, 110, 220, 145], fill=(20, 180, 150, 255))
    d.ellipse([195, 120, 210, 135], fill=(10, 20, 30, 255))
    d.ellipse([198, 122, 203, 127], fill=(255, 255, 255, 255))
    # Left Eye
    d.ellipse([100, 105, 155, 160], fill=(250, 255, 230, 255), outline=(60, 20, 90, 255), width=3)
    d.ellipse([120, 122, 145, 147], fill=(20, 180, 150, 255))
    d.ellipse([128, 129, 138, 139], fill=(10, 20, 30, 255))
    # Right Eye
    d.ellipse([245, 105, 300, 160], fill=(250, 255, 230, 255), outline=(60, 20, 90, 255), width=3)
    d.ellipse([258, 122, 283, 147], fill=(20, 180, 150, 255))
    d.ellipse([265, 129, 275, 139], fill=(10, 20, 30, 255))
    # Dripping slime bottom
    d.ellipse([80, 235, 130, 270], fill=(155, 50, 235, 240))
    d.ellipse([180, 240, 230, 275], fill=(155, 50, 235, 240))
    d.ellipse([270, 235, 320, 268], fill=(155, 50, 235, 240))
    im.save(IMG_DIR / "blob_alien.png")
    print("Created blob_alien.png")

def make_power_up():
    # Glowing star badge with golden ring and lightning bolt
    im = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    # Outer glow ring
    d.ellipse([10, 10, 118, 118], fill=(255, 215, 0, 60), outline=(255, 200, 0, 200), width=4)
    # Inner orb
    d.ellipse([18, 18, 110, 110], fill=(20, 160, 255, 240), outline=(255, 255, 255, 255), width=3)
    # Lightning bolt inside
    bolt_pts = [
        (68, 26), (42, 68), (62, 68),
        (54, 102), (86, 56), (68, 56)
    ]
    d.polygon(bolt_pts, fill=(255, 245, 50, 255), outline=(255, 140, 0, 255), width=2)
    # Shine highlight
    d.ellipse([30, 26, 50, 42], fill=(255, 255, 255, 180))
    im.save(IMG_DIR / "power_up.png")
    print("Created power_up.png")

if __name__ == "__main__":
    make_slow_fly()
    make_fast_fly()
    make_alien_king()
    make_space_cow()
    make_blob_alien()
    make_power_up()
