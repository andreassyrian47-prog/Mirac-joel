from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json, subprocess, imageio_ffmpeg
root=Path(__file__).resolve().parent.parent
frames=root/'.cache/artistry-master'
data=json.loads((frames/'manifest.json').read_text())
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',13)
big=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',21)
small=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',10)
output=root/'ARTISTRY-all-23-finishers.mp4'
p=subprocess.Popen([imageio_ffmpeg.get_ffmpeg_exe(),'-y','-f','rawvideo','-vcodec','rawvideo','-pix_fmt','rgb24','-s','720x584','-r','30','-i','-','-an','-vcodec','libx264','-crf','19','-preset','fast','-pix_fmt','yuv420p','-movflags','+faststart',str(output)],stdin=subprocess.PIPE,stderr=subprocess.DEVNULL)
chapters=[]
for f in data:
 if not chapters or chapters[-1]['name']!=f['title']:chapters.append({'name':f['title'],'id':f['id'],'seconds':f['n']/30})
 im=Image.new('RGB',(720,584),'#101a20');im.paste(Image.open(frames/f"{f['n']:05}.png").convert('RGB'),(0,44));d=ImageDraw.Draw(im)
 d.text((20,12),'HELLBOUND / ARTISTRY',font=font,fill='#dab88e');d.text((482,15),'v0.9 · in-game motion study · 30 fps',font=small,fill='#91a3a8')
 d.text((20,530),f['title'],font=big,fill='#f0dfc8');d.text((21,561),f['phase'].upper(),font=small,fill='#b69b79');d.text((531,550),f"{f['time']:.2f} / {f['duration']:.2f}s",font=font,fill='#91a3a8')
 p.stdin.write(im.tobytes())
p.stdin.close();assert p.wait()==0
(root/'tests/artistry-chapters.json').write_text(json.dumps(chapters,indent=2))
print(output,output.stat().st_size,'bytes',len(data)/30,'seconds')
