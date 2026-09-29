from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
import json,sys
p=Path('.cache/artistry-'+(sys.argv[1] if len(sys.argv)>1 else 'after'));a=json.loads((p/'manifest.json').read_text());font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',17)
for group in range(6):
 names=list(dict.fromkeys(f['title'] for f in a))[group*4:group*4+4];sheet=Image.new('RGB',(1440,len(names)*520),'#101820');d=ImageDraw.Draw(sheet)
 for r,name in enumerate(names):
  fs=[f for f in a if f['title']==name]
  if len(fs)>8:fs=[min(fs,key=lambda f:abs(f['time']/f['duration']-t)) for t in [.08,.20,.34,.47,.60,.73,.83,.94]]
  for k,f in enumerate(fs):
   x=k%4*360;y=r*520+k//4*260;sheet.paste(Image.open(p/f"{f['n']:05}.png").resize((360,240)),(x,y));d.text((x+4,y+240),f"{name} {f['time']:.2f}s",font=font,fill='#e2ccaa')
 sheet.save(p/f'review-{group}.jpg')
