# Host-local release staging. Rust keeps its normal dependency cache.
[CmdletBinding()]
param([ValidatePattern('^[a-z0-9_-]+$')][string]$Target)
$ErrorActionPreference='Stop'
if ($env:GITHUB_ACTIONS -cne 'true' -or $env:RUNNER_ENVIRONMENT -cne 'github-hosted') {
    throw 'Release staging requires the project hosted release job.'
}
$root=(Get-Item -LiteralPath $env:GITHUB_WORKSPACE).FullName
$source=& git -C $root rev-parse HEAD
if ($LASTEXITCODE -or $source -cne $env:GITHUB_SHA) {throw 'Requested checkout changed.'}
Push-Location -LiteralPath (Join-Path $root 'src-tauri')
try {
    $metadata=& cargo metadata --no-deps --format-version 1 --manifest-path Cargo.toml
    if ($LASTEXITCODE) {throw 'Cargo target directory unavailable.'}
    $output=($metadata|ConvertFrom-Json).target_directory
    if (![IO.Path]::IsPathRooted($output)) {throw 'Cargo output is not absolute.'}
    $profile=if ($Target) {Join-Path $output $Target} else {$output}
    $bundles=Join-Path $profile 'release/bundle'
    if ((Test-Path -LiteralPath $bundles) -and @(Get-ChildItem -LiteralPath $bundles -Force).Count) {
        throw 'A previous bundle exists in the release output. Preserve it and use a clean release job.'
    }
    $native=if ($IsWindows) {'npm.cmd'} else {'npm'}
    $options=@('run','tauri','build')
    if ($Target) {$options+=@('--','--target',$Target)}
    Push-Location -LiteralPath $root
    try { & $native @options; if ($LASTEXITCODE) {throw 'Tauri build failed.'} } finally {Pop-Location}
    $stage=Join-Path $env:RUNNER_TEMP ('tauri-release-'+[guid]::NewGuid().ToString('N'))
    [void][IO.Directory]::CreateDirectory($stage)
    $rows=@(foreach ($file in Get-ChildItem -LiteralPath $bundles -Recurse -File) {
        if ($file.Name -notmatch '\.(msi|exe|dmg|deb|rpm|AppImage|gz|zip|sig)$' -or
            $file.FullName -match '\.app[\\/]') {continue}
        if (($file.Attributes -band [IO.FileAttributes]::ReparsePoint) -or !$file.Length) {throw 'Invalid package member.'}
        $dest=Join-Path $stage $file.Name
        [IO.File]::Copy($file.FullName,$dest,$false)
        $sha=(Get-FileHash -LiteralPath $file.FullName).Hash
        if ((Get-FileHash -LiteralPath $dest).Hash -cne $sha) {throw 'Package changed during staging.'}
        [ordered]@{file=$file.Name;bytes=$file.Length;sha256=$sha}
    })
    if (!@($rows|Where-Object {$_.file -notmatch '\.sig$'}).Count) {throw 'No installer was produced.'}
    $platform=if ($Target) {$Target} else {$env:RUNNER_OS}
    $receipt=[ordered]@{schema='project.tauri_package.v1';source=$source;cargo_target=$output;bundle_directory=$bundles;
        package_reused=$false;cargo_fresh_units=$null;artifacts=$rows}
    $receipt|ConvertTo-Json -Depth 4|Set-Content -LiteralPath (Join-Path $stage ("build-receipt-$platform.json")) -Encoding utf8NoBOM
    "ELON_TAURI_ASSETS=$($stage.Replace('\','/'))/*" | Out-File -LiteralPath $env:GITHUB_ENV -Encoding utf8 -Append
} finally {Pop-Location}
