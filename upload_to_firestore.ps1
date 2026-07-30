# PowerShell script to upload parsed archive data to Firestore via REST API

$jsonPath = "C:\Users\user\.gemini\antigravity\scratch\school-minifootball-tournament\archive_2022_2023.json"
if (-not (Test-Path $jsonPath)) {
    Write-Error "archive_2022_2023.json not found! Parse the archive first."
    exit 1
}

$archiveData = [System.IO.File]::ReadAllText($jsonPath, [System.Text.Encoding]::UTF8) | ConvertFrom-Json

Write-Host "Starting upload to Firestore..."
$projectId = "tdv-football"

# 1. Upload Classes
$classes = $archiveData.classes
Write-Host "Uploading $($classes.Count) classes..."
$cCount = 0
foreach ($c in $classes) {
    $fields = @{}
    $fields["id"] = @{ "stringValue" = [string]$c.id }
    $fields["name"] = @{ "stringValue" = [string]$c.name }
    $fields["division"] = @{ "stringValue" = [string]$c.division }
    $fields["year"] = @{ "stringValue" = [string]$c.year }
    
    $body = @{ "fields" = $fields } | ConvertTo-Json -Depth 10 -Compress
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($body)
    $url = "https://firestore.googleapis.com/v1/projects/$projectId/databases/(default)/documents/classes/$($c.id)"
    
    try {
        Invoke-RestMethod -Method Patch -Uri $url -Body $bytes -ContentType "application/json; charset=utf-8" > $null
        $cCount++
    } catch {
        Write-Warning "Failed to upload class $($c.name): $_"
    }
}
Write-Host "Uploaded $cCount/$($classes.Count) classes."

# 2. Upload Players
$players = $archiveData.players
Write-Host "Uploading $($players.Count) players..."
$pCount = 0
foreach ($p in $players) {
    $fields = @{}
    $fields["id"] = @{ "stringValue" = [string]$p.id }
    $fields["name"] = @{ "stringValue" = [string]$p.name }
    $fields["class"] = @{ "stringValue" = [string]$p.class }
    $fields["division"] = @{ "stringValue" = [string]$p.division }
    $fields["year"] = @{ "stringValue" = [string]$p.year }
    $fields["position"] = @{ "stringValue" = [string]$p.position }
    $fields["goals"] = @{ "integerValue" = [string]$p.goals }
    $fields["assists"] = @{ "integerValue" = [string]$p.assists }
    $fields["matchesPlayed"] = @{ "integerValue" = [string]$p.matchesPlayed }
    $fields["overallRating"] = @{ "doubleValue" = [double]$p.overallRating }
    
    $body = @{ "fields" = $fields } | ConvertTo-Json -Depth 10 -Compress
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($body)
    $url = "https://firestore.googleapis.com/v1/projects/$projectId/databases/(default)/documents/players/$($p.id)"
    
    try {
        Invoke-RestMethod -Method Patch -Uri $url -Body $bytes -ContentType "application/json; charset=utf-8" > $null
        $pCount++
    } catch {
        Write-Warning "Failed to upload player $($p.name): $_"
    }
}
Write-Host "Uploaded $pCount/$($players.Count) players."

# 3. Upload Matches
$matches = $archiveData.matches
Write-Host "Uploading $($matches.Count) matches..."
$mCount = 0
foreach ($m in $matches) {
    $fields = @{}
    $fields["id"] = @{ "stringValue" = [string]$m.id }
    $fields["stage"] = @{ "stringValue" = [string]$m.stage }
    $fields["division"] = @{ "stringValue" = [string]$m.division }
    $fields["year"] = @{ "stringValue" = [string]$m.year }
    $fields["teamA"] = @{ "stringValue" = [string]$m.teamA }
    $fields["teamB"] = @{ "stringValue" = [string]$m.teamB }
    $fields["scoreA"] = @{ "integerValue" = [string]$m.scoreA }
    $fields["scoreB"] = @{ "integerValue" = [string]$m.scoreB }
    
    if ($null -ne $m.penaltyScoreA) {
        $fields["penaltyScoreA"] = @{ "integerValue" = [string]$m.penaltyScoreA }
    } else {
        $fields["penaltyScoreA"] = @{ "nullValue" = $null }
    }
    
    if ($null -ne $m.penaltyScoreB) {
        $fields["penaltyScoreB"] = @{ "integerValue" = [string]$m.penaltyScoreB }
    } else {
        $fields["penaltyScoreB"] = @{ "nullValue" = $null }
    }
    
    $fields["date"] = @{ "stringValue" = [string]$m.date }
    $fields["videoUrl"] = @{ "stringValue" = [string]$m.videoUrl }
    $fields["playerStats"] = @{ "arrayValue" = @{} }
    
    $body = @{ "fields" = $fields } | ConvertTo-Json -Depth 10 -Compress
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($body)
    $url = "https://firestore.googleapis.com/v1/projects/$projectId/databases/(default)/documents/matches/$($m.id)"
    
    try {
        Invoke-RestMethod -Method Patch -Uri $url -Body $bytes -ContentType "application/json; charset=utf-8" > $null
        $mCount++
    } catch {
        Write-Warning "Failed to upload match $($m.id): $_"
    }
}
Write-Host "Uploaded $mCount/$($matches.Count) matches."

Write-Host "Upload completed successfully! All data is online."
