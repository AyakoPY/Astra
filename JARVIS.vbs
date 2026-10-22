Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
d = fso.GetParentFolderName(WScript.ScriptFullName)
sh.CurrentDirectory = d
If Not fso.FolderExists(d & "\logs") Then fso.CreateFolder(d & "\logs")
nodeCmd = "node"
npmCmd = "npm"
If fso.FileExists(d & "\node\node.exe") Then
  nodeCmd = """" & d & "\node\node.exe"""
  npmCmd = """" & d & "\node\npm.cmd"""
End If
If Not fso.FolderExists(d & "\node_modules") Then sh.Run "cmd /c " & npmCmd & " install --omit=dev --no-audit --no-fund", 1, True
' cierra lo que esté usando el puerto 3000 (una versión vieja de Astra que se quedó abierta)
' acceso directo con el icono de Astra (en esta carpeta y en el escritorio)
On Error Resume Next
If fso.FileExists(d & "\astra.ico") Then
  For Each lp In Array(d & "\Astra.lnk", sh.SpecialFolders("Desktop") & "\Astra.lnk")
    If Not fso.FileExists(lp) Then
      Set sc = sh.CreateShortcut(lp)
      sc.TargetPath = "wscript.exe"
      sc.Arguments = """" & d & "\JARVIS.vbs"""
      sc.WorkingDirectory = d
      sc.IconLocation = d & "\astra.ico,0"
      sc.WindowStyle = 7
      sc.Description = "Astra"
      sc.Save
    End If
  Next
End If
On Error GoTo 0
sh.Run "powershell -NoProfile -WindowStyle Hidden -Command ""Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }""", 0, True
WScript.Sleep 800
sh.Run "cmd /c " & nodeCmd & " server.js >> logs\server.log 2>&1", 0, False
' espera a que el servidor responda (hasta 45 s) antes de abrir la ventana: así no sale "localhost rechazó la conexión" en el primer arranque
On Error Resume Next
For i = 1 To 90
  Err.Clear
  Set hx = CreateObject("MSXML2.ServerXMLHTTP.6.0")
  hx.setTimeouts 1000, 1000, 1000, 1000
  hx.open "GET", "http://127.0.0.1:3000/api/version", False
  hx.send
  If Err.Number = 0 Then
    If hx.Status = 200 Then Exit For
  End If
  WScript.Sleep 500
Next
Err.Clear
On Error GoTo 0
url = "http://localhost:3000"
If WScript.Arguments.Count > 0 Then
  If WScript.Arguments(0) = "reinicio" Then WScript.Quit
End If
la = sh.ExpandEnvironmentStrings("%LOCALAPPDATA%")
paths = Array("C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe", "C:\Program Files (x86)\BraveSoftware\Brave-Browser\Application\brave.exe", la & "\BraveSoftware\Brave-Browser\Application\brave.exe")
On Error Resume Next
sh.Run "msedge --app=" & url, 1, False
If Err.Number <> 0 Then
  Err.Clear
  ok = False
  For Each p In paths
    If fso.FileExists(p) Then
      sh.Run """" & p & """ --app=" & url, 1, False
      ok = True
      Exit For
    End If
  Next
  If Not ok Then sh.Run url
End If
