<#
.SYNOPSIS
  Handbook — Windows PowerShell Launcher
#>

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir

$ExeX64 = Join-Path $RootDir "dist\Handbook-win32-x64\Handbook.exe"
$ExeArm64 = Join-Path $RootDir "dist\Handbook-win32-arm64\Handbook.exe"
$NodeLauncher = Join-Path $RootDir "bin\handbook.js"

if (Test-Path $ExeX64) {
    Start-Process $ExeX64 -ArgumentList $args
    exit 0
}

if (Test-Path $ExeArm64) {
    Start-Process $ExeArm64 -ArgumentList $args
    exit 0
}

if (Test-Path $NodeLauncher) {
    & node $NodeLauncher @args
    exit 0
}

$ElectronCmd = Join-Path $RootDir "node_modules\.bin\electron.cmd"
if (Test-Path $ElectronCmd) {
    Start-Process $ElectronCmd -ArgumentList @($RootDir) + $args
    exit 0
}
