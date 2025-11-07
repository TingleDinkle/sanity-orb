# Create Desktop Shortcut for Sanity Orb
$WshShell = New-Object -comObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\Start Sanity Orb.lnk")
$Shortcut.TargetPath = "cmd.exe"
$Shortcut.Arguments = '/k "cd /d C:\Users\Omen\sanity-orb && start-all-simple.bat"'
$Shortcut.WorkingDirectory = "C:\Users\Omen\sanity-orb"
$Shortcut.IconLocation = "cmd.exe,0"
$Shortcut.Description = "Start the Sanity Orb application"
$Shortcut.Save()

Write-Host "Desktop shortcut created successfully!"
Write-Host "Double-click 'Start Sanity Orb.lnk' on your desktop to run the application."
