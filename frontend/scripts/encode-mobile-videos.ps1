param(
    [string]$FfmpegPath = 'ffmpeg'
)

$ErrorActionPreference = 'Stop'
$videoDirectory = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../public/videos'))

# Keep the complete source frame. The mobile layouts use object-fit: contain.
# AAC is retained so viewers can explicitly turn on sound for event intros.
$introVideos = @(
    @{ Source = 'hero-video.mp4'; Output = 'bgmi-intro-mobile.mp4' },
    @{ Source = 'vid2.mp4'; Output = 'bgmi-briefing-mobile.mp4' },
    @{ Source = 'thor_epic.mp4'; Output = 'researchx-intro-mobile.mp4' }
)

foreach ($video in $introVideos) {
    & $FfmpegPath -hide_banner -loglevel error -y `
        -i (Join-Path $videoDirectory $video.Source) `
        -map 0:v:0 -map '0:a:0?' -map_metadata -1 `
        -vf "scale='min(960,iw)':-2:flags=lanczos,setsar=1" `
        -c:v libx264 -preset slow -crf 24 -maxrate 2200k -bufsize 4400k `
        -pix_fmt yuv420p -profile:v high -level:v 3.1 `
        -c:a aac -b:a 96k -ac 2 -movflags +faststart `
        (Join-Path $videoDirectory $video.Output)
    if ($LASTEXITCODE -ne 0) { throw "Could not encode $($video.Output)" }
}

# Every hero frame is independently decodable so touch scrolling can seek in
# either direction without waiting for a distant keyframe. Audio is unnecessary.
& $FfmpegPath -hide_banner -loglevel error -y `
    -i (Join-Path $videoDirectory 'hero-seq-v2.mp4') `
    -map 0:v:0 -map_metadata -1 -an `
    -vf "scale='min(720,iw)':-2:flags=lanczos,setsar=1,fps=30" `
    -c:v libx264 -preset slow -crf 23 -g 1 -keyint_min 1 -sc_threshold 0 `
    -pix_fmt yuv420p -profile:v high -level:v 3.1 -movflags +faststart `
    (Join-Path $videoDirectory 'hero-scroll-mobile.mp4')
if ($LASTEXITCODE -ne 0) { throw 'Could not encode hero-scroll-mobile.mp4' }

$outputPaths = @($introVideos | ForEach-Object { Join-Path $videoDirectory $_.Output })
$outputPaths += Join-Path $videoDirectory 'hero-scroll-mobile.mp4'
Get-Item -LiteralPath $outputPaths | Select-Object Name, Length
