# Escucha offline de "hola <nombre>" con el reconocedor de voz de Windows (System.Speech). Archivo solo ASCII a proposito.
# Salida (una linea por evento): READY, LOW, WAKE, ENROLL, ERROR, PROBE_OK
param([string]$Name = 'jarvis', [int]$ParentPid = 0, [double]$MinConf = 0.45, [switch]$Probe)
$ErrorActionPreference = 'Stop'
function Say($s) { [Console]::Out.WriteLine($s); [Console]::Out.Flush() }
function Err($e) { return ($e.Exception.GetType().Name + ': ' + $e.Exception.Message) }
try {
  Add-Type -AssemblyName System.Speech
  $all = @([System.Speech.Recognition.SpeechRecognitionEngine]::InstalledRecognizers())
  if ($all.Count -eq 0) { Say 'ERROR Windows no tiene ningun reconocedor de voz instalado (Configuracion > Hora e idioma > Voz)'; exit 2 }
  $cultures = ($all | ForEach-Object { $_.Culture.Name }) -join ','
  $ordered = @($all | Where-Object { $_.Culture.Name -like 'es*' }) + @($all | Where-Object { $_.Culture.Name -notlike 'es*' })
  $engine = $null; $culture = ''; $dict = $false; $why = @()
  $starts = @('hola', 'oye', 'hey', 'ok')
  # Intento 1: gramatica cerrada con frases completas ("hola astra", ...) + "reconoce mi voz"
  foreach ($info in $ordered) {
    try {
      $e = New-Object System.Speech.Recognition.SpeechRecognitionEngine -ArgumentList $info
      $e.SetInputToDefaultAudioDevice()
      $phr = New-Object System.Speech.Recognition.Choices
      $phr.Add($Name)
      foreach ($s in $starts) { $phr.Add(($s + ' ' + $Name)) }
      $phr.Add('reconoce mi voz')
      $gb = New-Object System.Speech.Recognition.GrammarBuilder($phr)
      $e.LoadGrammar((New-Object System.Speech.Recognition.Grammar($gb)))
      $engine = $e; $culture = $info.Culture.Name; break
    } catch { $why += ($info.Culture.Name + ' cerrada: ' + (Err $_)) }
  }
  # Intento 2: dictado libre y se busca la frase en el texto
  if (-not $engine) {
    foreach ($info in $ordered) {
      try {
        $e = New-Object System.Speech.Recognition.SpeechRecognitionEngine -ArgumentList $info
        $e.SetInputToDefaultAudioDevice()
        $e.LoadGrammar((New-Object System.Speech.Recognition.DictationGrammar))
        $engine = $e; $culture = $info.Culture.Name; $dict = $true; break
      } catch { $why += ($info.Culture.Name + ' dictado: ' + (Err $_)) }
    }
  }
  if (-not $engine) { Say ('ERROR No pude iniciar el reconocedor. ' + ($why -join ' | ') + ' (revisa Configuracion > Privacidad > Microfono: permitir apps de escritorio)'); exit 3 }
  Say ('READY ' + $culture + $(if ($dict) { ' modo-dictado' } else { '' }) + ' (instalados: ' + $cultures + ')')
  if ($Probe) { Say 'PROBE_OK'; exit 0 }
  $rx = '(?i)\b((hola|ola|oye|hey|ok|okay)\W+)?' + [regex]::Escape($Name) + '\b'
  while ($true) {
    if ($ParentPid -gt 0 -and -not (Get-Process -Id $ParentPid -ErrorAction SilentlyContinue)) { exit 1 }
    $r = $engine.Recognize([TimeSpan]::FromSeconds(3))
    if (-not $r) { continue }
    if ($r.Text -like 'reconoce*') { Say ('ENROLL ' + $r.Text); exit 0 }
    if ($dict) { if ($r.Text -match $rx) { Say ('WAKE ' + $r.Text); exit 0 } else { continue } }
    $need = $MinConf; if ($r.Text.Trim() -ieq $Name) { $need = [math]::Min(0.95, $MinConf + 0.05) }   # la palabra sola es mas propensa a falsos positivos: pide mas seguridad
    if ($r.Confidence -ge $need) { Say ('WAKE ' + $r.Text + ' ' + [math]::Round($r.Confidence, 2)); exit 0 }
    Say ('LOW ' + $r.Text + ' ' + [math]::Round($r.Confidence, 2))
  }
} catch { Say ('ERROR ' + (Err $_)); exit 3 }
