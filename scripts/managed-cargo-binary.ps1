# Consume Cargo's result for this invocation, including fresh (reused) artifacts.
function Assert-ProjectBuildArtifact {
    param([Parameter(Mandatory)]$Receipt, [Parameter(Mandatory)][string]$Path, [string]$ExpectedCommit)
    $item=Get-Item -LiteralPath $Path -ErrorAction Stop
    if ($Receipt.schema -cne 'elon.project_cargo_output.v1' -or
        ($ExpectedCommit -and $Receipt.source -cne $ExpectedCommit) -or
        $item.PSIsContainer -or $item.Length -ne $Receipt.bytes -or
        (Get-FileHash -LiteralPath $item.FullName -Algorithm SHA256).Hash -ine $Receipt.sha256) {
        throw 'Packaged file differs from this build output receipt.'
    }
}

function Get-ProjectManagedCargoBinary {
    param([string]$Root,[string]$Manifest,[string]$Binary,[string[]]$BuildArguments,
        [string]$Domain,[switch]$PassThru,[switch]$HostedRunner,[scriptblock]$PreparedCargo)
    $ErrorActionPreference='Stop'
    $manifestPath=[IO.Path]::GetFullPath((Join-Path $Root $Manifest))
    $source=& git -C $Root rev-parse --verify HEAD
    if ($LASTEXITCODE -ne 0 -or $source -cnotmatch '^[0-9a-f]{40,64}$') {throw 'Cannot bind Cargo result to source.'}
    $artifact=$null
    $fresh=$null
    $reused=0
    $compiled=0
    $projectCargoExit=$null
    $arguments=@($BuildArguments)+@('--manifest-path',$manifestPath,'--bin',$Binary,'--message-format=json-render-diagnostics')
    $entry=Join-Path $Root 'scripts/rust-cache.ps1'
    if ($HostedRunner -and !($env:GITHUB_ACTIONS -eq 'true' -and $env:RUNNER_ENVIRONMENT -eq 'github-hosted')) {
        throw 'Direct CI Cargo execution requires a GitHub-hosted runner.'
    }
    & {
        if ($PreparedCargo) { & $PreparedCargo $arguments }
        elseif ($HostedRunner) {
            Push-Location -LiteralPath (Split-Path -Parent $manifestPath)
            try { & cargo @arguments } finally { Pop-Location }
        }
        elseif ($Domain) {& $entry run -Domain $Domain -RemainingArgs $arguments}
        else {& $entry run -RemainingArgs $arguments}
        # Publish the child exit code in the caller scope after the pipeline completes.
        Set-Variable -Scope 1 -Name projectCargoExit -Value $LASTEXITCODE
    } | ForEach-Object {
        $line=[string]$_
        if (-not $line.StartsWith('{')) {Write-Host $line;return}
        $message=$line | ConvertFrom-Json -ErrorAction Stop
        if ($message.reason -ne 'compiler-artifact') {return}
        if ($message.fresh -is [bool]) {if ($message.fresh) {$reused++} else {$compiled++}}
        if ($message.target.name -ceq $Binary -and $message.target.kind -contains 'bin' -and
            $message.manifest_path -and [IO.Path]::GetFullPath($message.manifest_path) -eq $manifestPath -and $message.executable) {
            if ($artifact -and $artifact -cne $message.executable) {throw 'Conflicting executable paths from this invocation.'}
            $artifact=[string]$message.executable
            $fresh=$message.fresh
        }
    }
    if ($null -eq $projectCargoExit -or $projectCargoExit -ne 0 -or -not $artifact -or -not [IO.Path]::IsPathRooted($artifact) -or
        -not [IO.File]::Exists($artifact)) {throw "Managed build did not return an executable for $Binary."}
    $after=& git -C $Root rev-parse --verify HEAD
    if ($LASTEXITCODE -ne 0 -or $after -cne $source) {throw 'Source changed during Cargo execution.'}
    $file=Get-Item -LiteralPath $artifact -ErrorAction Stop
    $receipt=[pscustomobject][ordered]@{schema='elon.project_cargo_output.v1';source=$source;manifest=$manifestPath
        binary=$Binary;arguments=$arguments;domain=$Domain;path=$file.FullName;output_directory=$file.DirectoryName
        fresh=$fresh;cargo_fresh_units=$reused;cargo_compiled_units=$compiled;bytes=$file.Length
        sha256=(Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant()}
    Write-Host ('ELON_BUILD_OUTPUT='+($receipt|ConvertTo-Json -Depth 4 -Compress))
    if ($PassThru) {return $receipt}
    return $file.FullName
}
