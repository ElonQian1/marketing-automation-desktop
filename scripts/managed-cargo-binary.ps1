# Resolve the executable from this invocation's Cargo messages, including cache hits.
function Get-ProjectManagedCargoBinary {
    param([string]$Root,[string]$Manifest,[string]$Binary,[string[]]$BuildArguments)
    $ErrorActionPreference='Stop'
    $artifact=$null
    $manifestPath=[IO.Path]::GetFullPath((Join-Path $Root $Manifest))
    $arguments=@($BuildArguments)+@('--manifest-path',$manifestPath,'--bin',$Binary,'--message-format=json-render-diagnostics')
    $entry=Join-Path $Root 'scripts/rust-cache.ps1'
    & $entry run -RemainingArgs $arguments | ForEach-Object {
        $line=[string]$_
        if (-not $line.StartsWith('{')) { Write-Host $line; return }
        $message=$line | ConvertFrom-Json -ErrorAction Stop
        if ($message.reason -eq 'compiler-artifact' -and $message.target.name -ceq $Binary -and
            $message.target.kind -contains 'bin' -and $message.manifest_path -and
            [IO.Path]::GetFullPath($message.manifest_path) -eq $manifestPath -and $message.executable) {
            $artifact=[string]$message.executable
        }
    }
    if ($LASTEXITCODE -ne 0 -or -not $artifact -or -not [IO.Path]::IsPathRooted($artifact) -or
        -not [IO.File]::Exists($artifact)) { throw "Managed build did not return an executable for $Binary." }
    return $artifact
}
