"""캡처+음성+자막 → MP4. 사용: python make_video.py scenes.json out.mp4
scenes.json: [{"image":"cap1.png","audio":"n1.mp3"(선택),"text":"자막","seconds":7}, ...]
필요: ffmpeg"""
import json, subprocess, sys, os, tempfile
scenes=json.load(open(sys.argv[1])); out=sys.argv[2]; tmp=tempfile.mkdtemp(); parts=[]
def dur(a):
    r=subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",a],capture_output=True,text=True)
    return float(r.stdout.strip() or 0)
for i,s in enumerate(scenes):
    d=max(s.get("seconds",6), dur(s["audio"])+0.6 if s.get("audio") else 0)
    txt=s.get("text","").replace("'", "’").replace(":", "\\:")
    vf=("scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:white,"
        "zoompan=z='min(zoom+0.0008,1.08)':d=%d:s=1280x720:fps=30,"
        "drawbox=y=ih-110:w=iw:h=110:color=black@0.55:t=fill,"
        "drawtext=text='%s':fontcolor=white:fontsize=40:x=(w-tw)/2:y=h-80" % (int(d*30), txt))
    p=os.path.join(tmp,f"p{i}.mp4"); cmd=["ffmpeg","-y","-loop","1","-i",s["image"]]
    cmd+= ["-i",s["audio"]] if s.get("audio") else ["-f","lavfi","-i","anullsrc=r=44100:cl=stereo"]
    cmd+=["-t",str(d),"-vf",vf,"-c:v","libx264","-pix_fmt","yuv420p","-c:a","aac","-shortest",p]
    if os.environ.get("FONT"): cmd[cmd.index("-vf")+1]+=":fontfile="+os.environ["FONT"]
    subprocess.run(cmd,check=True,capture_output=True); parts.append(p)
lst=os.path.join(tmp,"l.txt"); open(lst,"w").write("".join(f"file '{p}'\n" for p in parts))
subprocess.run(["ffmpeg","-y","-f","concat","-safe","0","-i",lst,"-c","copy",out],check=True,capture_output=True)
print("saved",out)
