# Portable project entry. The project publisher owns locking, signatures and deployment.
[CmdletBinding()]
param(
    [ValidateSet('Inspect','Build','Publish')][string]$Intent='Inspect',
    [string]$ExpectedCommit,
    [string]$PackagePath
)
$ErrorActionPreference='Stop'
$root=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$gitRoot=(& git -C $root rev-parse --show-toplevel)
if ($LASTEXITCODE -ne 0 -or [IO.Path]::GetFullPath($gitRoot) -ne $root) { throw 'Invalid project root.' }
$commit=(& git -C $root rev-parse --verify HEAD)
if ($LASTEXITCODE -ne 0 -or $commit -cnotmatch '^[0-9a-f]{40,64}$' -or
    ($ExpectedCommit -and $ExpectedCommit -cne $commit)) { throw 'Build source does not match the requested revision.' }
foreach ($path in @('rust-cache.project.json','scripts/rust-cache.ps1')) {
    & git -C $root ls-files --error-unmatch -- $path > $null
    if ($LASTEXITCODE -ne 0 -or -not [IO.File]::Exists((Join-Path $root $path))) { throw "Missing tracked build entry: $path" }
}
$manifest=[IO.File]::ReadAllText((Join-Path $root 'rust-cache.project.json')) | ConvertFrom-Json
if ($manifest.schema_version -ne 1 -or -not $manifest.project_id) { throw 'Invalid project cache manifest.' }
$locations=[ordered]@{workspace=$root;temp=[IO.Path]::GetTempPath()}
if ($PackagePath) { $locations['package']=$PackagePath }
foreach ($name in @('CARGO_TARGET_DIR','CARGO_BUILD_BUILD_DIR','SCCACHE_DIR','GRADLE_USER_HOME','RUNNER_TEMP')) {
    $value=[Environment]::GetEnvironmentVariable($name)
    if ($value) { $locations[$name]=$value }
}
$hosted=$env:GITHUB_ACTIONS -eq 'true' -and $env:RUNNER_ENVIRONMENT -eq 'github-hosted'
if ($env:OS -eq 'Windows_NT' -and -not $hosted -and $Intent -ne 'Publish') {
    $platform=Join-Path $env:LOCALAPPDATA 'Elon/bin/rust-cache.ps1'
    if (-not [IO.File]::Exists($platform)) { throw 'Install the managed Rust cache platform on this Windows executor.' }
    $route=& $platform project-route -ProjectRoot $root
    if ($route.schema -ne 'elon.rust_cache.project_route_report.v1' -or $route.project_id -cne $manifest.project_id -or
        -not $route.project_registered -or -not $route.default_output_root) { throw 'Managed build route is not bound to this project.' }
    $locations['managed_output']=$route.default_output_root
    $locations['compiler_l1']=$route.l1_cache_dir
    $requiresShare=$route.PSObject.Properties['build_root_policy'] -and $route.build_root_policy -eq 'configured-shared-required'
    if ($Intent -eq 'Build' -and $requiresShare -and $route.default_output_root.StartsWith('\\') -and
        -not [IO.Directory]::Exists($route.default_output_root)) { throw 'Configured shared output unavailable. Keep the original request pending.' }
}
$volumes=foreach ($entry in $locations.GetEnumerator()) {
    if (-not $entry.Value) { continue }
    $path=if ([IO.Path]::IsPathRooted($entry.Value)) {[string]$entry.Value} else {Join-Path $root $entry.Value}
    $volume=[IO.Path]::GetPathRoot($path)
    $free=try { [IO.DriveInfo]::new($volume).AvailableFreeSpace } catch { $null }
    [pscustomobject]@{purpose=$entry.Key;path=$path;volume=$volume;free_bytes=$free}
}
[pscustomobject]@{schema='elon.subproject_build_preflight.v1';project=$manifest.project_id;
    source=$commit;intent=$Intent;hosted_runner=$hosted;locations=@($volumes)} | ConvertTo-Json -Depth 4 -Compress
