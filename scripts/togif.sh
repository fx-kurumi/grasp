# togif in.mp4 out.gif fps
f=$3; ffmpeg -loglevel error -y -i "$1" -vf "fps=$f,scale=${4:-960}:-1:flags=lanczos,split[a][b];[a]palettegen=stats_mode=diff:max_colors=128[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle" "$2"
