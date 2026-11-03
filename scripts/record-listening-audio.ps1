$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$speaker = New-Object System.Speech.Synthesis.SpeechSynthesizer
$speaker.SelectVoice('Microsoft Zira Desktop')
$speaker.Rate = -1
$format = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(22050, [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen, [System.Speech.AudioFormat.AudioChannel]::Mono)
$jobs = Get-Content -LiteralPath 'outputs/listening-audio/jobs.json' -Raw -Encoding UTF8 | ConvertFrom-Json
foreach ($job in $jobs) {
  if (Test-Path -LiteralPath $job.path) { continue }
  $speaker.SetOutputToWaveFile([System.IO.Path]::GetFullPath($job.path), $format)
  $speaker.Speak($job.text)
  $speaker.SetOutputToNull()
}
$speaker.Dispose()
Write-Output ('Recorded {0} listening clips.' -f $jobs.Count)
