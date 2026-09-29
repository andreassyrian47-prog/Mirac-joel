from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json, subprocess, imageio_ffmpeg
root=Path(__file__).resolve().parent.parent
frames=root/'.cache/carnage';data=json.loads((frames/'manifest.json').read_text())
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',13)
big=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',25)
small=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',11)
output=root/'CARNAGE-motion-preview.mp4'
p=subprocess.Popen([imageio_ffmpeg.get_ffmpeg_exe(),'-y','-f','rawvideo','-vcodec','rawvideo','-pix_fmt','rgb24','-s','960x640','-r','30','-i','-','-an','-vcodec','libx264','-crf','20','-preset','fast','-pix_fmt','yuv420p','-movflags','+faststart',str(output)],stdin=subprocess.PIPE,stderr=subprocess.DEVNULL)
for f in data:
 im=Image.open(frames/f"{f['n']:05}.png").convert('RGB');d=ImageDraw.Draw(im)
 d.rectangle((0,0,960,57),fill='#101a20');d.line((24,56,936,56),fill='#765c42',width=1)
 d.text((24,12),'HELLBOUND / CARNAGE',font=font,fill='#dab88e');d.text((24,33),'Animation study · in-game rigs · simplified stage',font=small,fill='#91a3a8')
 d.text((842,22),'v0.8 / 30 fps',font=small,fill='#91a3a8')
 d.rectangle((0,558,960,640),fill='#101a20');d.text((24,568),f['title'],font=big,fill='#f0dfc8');d.text((25,607),f['state']['phase'].upper(),font=font,fill='#b69b79')
 d.text((600,607),'Authored choreography → constrained body simulation',font=small,fill='#91a3a8')
 p.stdin.write(im.tobytes())
p.stdin.close();assert p.wait()==0
print(output,output.stat().st_size,'bytes',len(data)/30,'seconds')
