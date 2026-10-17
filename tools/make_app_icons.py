#!/usr/bin/env python3
"""Optional icon authoring step (Pillow); release builds use the checked-in images."""
from pathlib import Path
import math
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'assets/app'
OUTPUT.mkdir(parents=True, exist_ok=True)
SCALE = 4
DARK, CREAM = '#173b33', '#fff3d6'

def star(cx, cy, outer, inner):
    return [(cx + (outer if i % 2 == 0 else inner) * math.cos(-math.pi/2+i*math.pi/5),
             cy + (outer if i % 2 == 0 else inner) * math.sin(-math.pi/2+i*math.pi/5)) for i in range(10)]

def curve(points, steps=96):
    result=[]
    for i in range(steps+1):
        t=i/steps;u=1-t
        result.append(tuple(u**3*points[0][j]+3*u*u*t*points[1][j]+3*u*t*t*points[2][j]+t**3*points[3][j] for j in [0,1]))
    return result

def icon(round_corners=True):
    size=512*SCALE
    image=Image.new('RGB',(size,size),DARK)
    ball=Image.new('RGB',(size,size));pixels=ball.load()
    for y in range(size):
        t=min(1,max(0,(y/SCALE-128)/292))
        c=tuple(round(a+(b-a)*t) for a,b in zip((255,167,78),(226,91,43)))
        ImageDraw.Draw(ball).line((0,y,size,y),fill=c)
    mask=Image.new('L',(size,size));md=ImageDraw.Draw(mask)
    md.ellipse(tuple(v*SCALE for v in (94,126,402,434)),fill=255)
    image.paste(ball,mask=mask);draw=ImageDraw.Draw(image)
    def line(pts,color=DARK,width=12):
        scaled=[(round(x*SCALE),round(y*SCALE)) for x,y in pts]
        draw.line(scaled,fill=color,width=width*SCALE,joint='curve')
    line([(94,280),(402,280)])
    line([(248,126),(248,434)])
    line(curve([(139,172),(314,210),(314,350),(139,388)]))
    line(curve([(357,172),(182,210),(182,350),(357,388)]))
    pts=star(353,159,72,33)
    draw.polygon([(x*SCALE,y*SCALE) for x,y in pts],fill=CREAM)
    line([*pts,pts[0]],DARK,10)
    # A short rising trail connects the star to the ball.
    line([(118,137),(166,112)],CREAM,10)
    line([(100,169),(126,155)],CREAM,7)
    image=image.convert('RGBA')
    if round_corners:
        alpha=Image.new('L',(size,size));ImageDraw.Draw(alpha).rounded_rectangle((0,0,size,size),radius=110*SCALE,fill=255)
        image.putalpha(alpha)
    return image

normal,maskable=icon(),icon(False)
for name,size in [('icon-192.png',192),('icon-512.png',512),('favicon-32.png',32)]:
    normal.resize((size,size),Image.Resampling.LANCZOS).save(OUTPUT/name)
for name,size in [('icon-maskable-512.png',512),('apple-touch-icon.png',180)]:
    maskable.resize((size,size),Image.Resampling.LANCZOS).save(OUTPUT/name)

points=' '.join(f'{x:.2f},{y:.2f}' for x,y in star(353,159,72,33))
(ROOT/'icon.svg').write_text(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs><linearGradient id="ball" x2="0" y2="1"><stop stop-color="#ffa74e"/><stop offset="1" stop-color="#e25b2b"/></linearGradient></defs>
  <rect width="512" height="512" rx="110" fill="{DARK}"/>
  <circle cx="248" cy="280" r="154" fill="url(#ball)"/>
  <g fill="none" stroke="{DARK}" stroke-width="12"><path d="M94 280h308M248 126v308M139 172C314 210 314 350 139 388M357 172C182 210 182 350 357 388"/></g>
  <path d="M118 137l48-25M100 169l26-14" fill="none" stroke="{CREAM}" stroke-width="9" stroke-linecap="round"/>
  <polygon points="{points}" fill="{CREAM}" stroke="{DARK}" stroke-width="10" stroke-linejoin="round"/>
</svg>\n''')
print('PASS · app SVG and five PNG sizes generated')
