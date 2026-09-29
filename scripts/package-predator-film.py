from pathlib import Path
import json,base64
from PIL import Image,ImageDraw,ImageFont
import imageio_ffmpeg
root=Path('.cache/predator-film'); files=sorted(root.glob('*.png'))
chapters=[('Prowl / side',75),('Prowl / rear',75),('Grave Driver',87),("Hell’s Guillotine",82),('Furnace Heart',90),('Gravity Coffin',98),('Soul Sever',93)]
assert len(files)>=sum(n for _,n in chapters)
manifest=[];n=0
for title,count in chapters:
 manifest.append(dict(title=title,start=n/30,end=(n+count)/30,first=n,count=count));n+=count
font='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
big=ImageFont.truetype(font,17);small=ImageFont.truetype(font,11)
writer=imageio_ffmpeg.write_frames('PREDATOR-showcase.mp4',(640,466),fps=30,codec='libx264',quality=6,macro_block_size=1,output_params=['-movflags','+faststart']);writer.send(None)
review=Image.new('RGB',(1280,len(chapters)*246),(11,17,20))
for i,path in enumerate(files[:n]):
 im=Image.open(path).convert('RGB');assert im.size==(640,420)
 chapter=next(c for c in manifest if c['first']<=i<c['first']+c['count'])
 frame=Image.new('RGB',(640,466),(11,17,20));frame.paste(im,(0,46));d=ImageDraw.Draw(frame)
 d.text((16,7),'HELLBOUND / PREDATOR',fill='#e2c39a',font=small)
 d.text((16,23),chapter['title'].upper(),fill='#f0f2ed',font=big)
 d.text((402,11),'v0.14.0 · engine motion study',fill='#a7b8b5',font=small)
 writer.send(frame.tobytes())
writer.close()
for row,c in enumerate(manifest):
 for col,phase in enumerate([.20,.44,.64,.82]):
  idx=c['first']+round(c['count']*phase);im=Image.open(files[idx]);im.thumbnail((320,210));review.paste(im,(col*320,row*246+30));ImageDraw.Draw(review).text((col*320+8,row*246+8),f"{c['title']} / {phase:.0%}",font=small,fill='white')
review.save('.cache/predator-final-review.jpg')
Path('tests/predator-review-results.json').write_text(json.dumps({'chapters':manifest,'frames':n,'fps':30,'seconds':n/30,'size':[640,466],'verifiedPNGFrames':n,'captureNote':'Five complete finisher chapters and two complete prowl chapters. Optional sixth finisher capture timed out; it is not included.'},indent=2))
buttons=''.join(f'<button onclick="seek({c["start"]})">{c["title"]}</button>' for c in manifest)
video=base64.b64encode(Path('PREDATOR-showcase.mp4').read_bytes()).decode()
Path('PREDATOR-showcase.html').write_text(f'''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>HELLBOUND — Predator motion study</title><style>*{{box-sizing:border-box}}body{{margin:0;background:#0c1417;color:#edf1e9;font:15px/1.7 system-ui,sans-serif}}main{{max-width:1020px;margin:auto;padding:42px 24px}}.tag{{font-size:12px;letter-spacing:3px;color:#d7a971}}h1{{font-size:clamp(30px,5vw,52px);line-height:1.15;margin:14px 0}}p{{color:#adbdba;max-width:780px}}video{{width:100%;max-height:68vh;background:#101c20;border:1px solid #344542;border-radius:8px}}nav{{display:flex;gap:8px;flex-wrap:wrap;margin:16px 0}}button{{border:1px solid #42524d;color:#e4e8dd;background:#182522;border-radius:6px;padding:10px 15px;cursor:pointer}}button:hover{{background:#30443a}}.note{{font-size:13px;border-top:1px solid #31423f;padding-top:18px}}</style><main><div class="tag">HELLBOUND · V0.14.0 · PREDATOR</div><h1>A stalk. A grip. A brutal release.</h1><p>The revised prowl and five newly choreographed finishers, captured from the actual game on a neutral stage. No generated animation or pre-rendered replacement characters.</p><video id="film" controls playsinline preload="metadata" src="data:video/mp4;base64,{video}"></video><nav>{buttons}</nav><nav><button onclick="document.getElementById('film').playbackRate=1">Normal speed</button><button onclick="document.getElementById('film').playbackRate=.5">Half speed</button></nav><p class="note">20-second fixed-step study: 60 Hz simulation, 30 fps capture. This is not a live performance benchmark. Most combat VFX are omitted to keep silhouettes and contacts readable. The game retains all 46 finishers, including Soulbreaker’s chest punch → rear dash → lift/slam and the sustained fire-ring ankle drags.</p></main><script>function seek(t){{const v=document.getElementById('film');v.currentTime=t;v.play().catch(()=>{{}})}}</script></html>''')
print(n,'frames; movie bytes',Path('PREDATOR-showcase.mp4').stat().st_size)
