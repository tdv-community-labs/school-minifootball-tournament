# PowerShell script to parse previous tournament statistics and generate archive_2022_2023.json

$rootPath = "C:\Users\user\.gemini\antigravity\scratch\school-minifootball-tournament\arxiv datalari\football"
$outputPath = "C:\Users\user\.gemini\antigravity\scratch\school-minifootball-tournament\archive_2022_2023.json"

$classes = [System.Collections.Generic.List[PSObject]]::new()
$players = [System.Collections.Generic.List[PSObject]]::new()
$matchList = [System.Collections.Generic.List[PSObject]]::new()

$classesMap = @{}
$playersMap = @{} # keyed by "name_class"

function Get-Division($className) {
    if ($className -like "6*") { return "6" }
    if ($className -like "7*" -or $className -like "8*") { return "7-8" }
    if ($className -like "9*" -or $className -like "10*") { return "9-10" }
    return "11"
}

function Clean-Name($name) {
    # Remove yellow/red cards emojis and trim
    $name = $name -replace "🟨|🟥|🟩|🟦|🟧|⬛|⬜|⚽|🏆", ""
    $name = $name -replace "\s+", " "
    return $name.Trim()
}

# 1. Parse Roster Files (komandalar/*.html)
Write-Host "Parsing rosters..."
$komandalarFiles = Get-ChildItem (Join-Path $rootPath "komandalar\*.html")
foreach ($file in $komandalarFiles) {
    $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    
    # Matches class divs: <div class="sinif"> ... <h2 class="sinif-baslik">Class Name</h2> ... </ul>
    # Use regex to find all class divs
    $pattern = '(?s)<div class="sinif">\s*<h2 class="sinif-baslik">([^<]+)</h2>\s*<ul class="oyuncular">([\s\S]*?)</ul>'
    $matchesObj = [regex]::Matches($content, $pattern)
    
    foreach ($m in $matchesObj) {
        $classNameRaw = $m.Groups[1].Value.Trim()
        # Clean class name (e.g. "6A sinifi" or "10A/B sinifi" -> "6A", "10A/B")
        $className = $classNameRaw -replace "\s*sinif.*", ""
        $className = $className.Trim()
        
        $div = Get-Division $className
        $classId = "c_22_" + $className.ToLower().Replace("/", "_").Replace("-", "_")
        
        if (-not $classesMap.ContainsKey($className)) {
            $classObj = [PSCustomObject]@{
                id = $classId
                name = $className
                division = $div
                year = "2022-2023"
            }
            $classes.Add($classObj)
            $classesMap[$className] = $classObj
        }
        
        $oyuncularHtml = $m.Groups[2].Value
        $liMatches = [regex]::Matches($oyuncularHtml, '<li>([^<]+)</li>')
        foreach ($li in $liMatches) {
            $playerName = Clean-Name($li.Groups[1].Value)
            if ($playerName -eq "" -or $playerName -eq "--------" -or $playerName -like "*---*") {
                continue
            }
            
            $key = $playerName + "_" + $className
            if (-not $playersMap.ContainsKey($key)) {
                $playerId = "p_22_" + $playerName.ToLower().Replace(" ", "_") + "_" + $className.ToLower().Replace("/", "_")
                # Remove special character signs from ID
                $playerId = $playerId -replace "[^a-z0-9_]", ""
                
                $playerObj = [PSCustomObject]@{
                    id = $playerId
                    name = $playerName
                    class = $className
                    division = $div
                    year = "2022-2023"
                    position = "Hücumçu" # default position
                    goals = 0
                    assists = 0
                    matchesPlayed = 0
                    overallRating = 6.0
                }
                $players.Add($playerObj)
                $playersMap[$key] = $playerObj
            }
        }
    }
}

# 2. Parse Scorers (bombardir/*.html) to update goals
Write-Host "Parsing scorers..."
$bombardirFiles = Get-ChildItem (Join-Path $rootPath "bombardir\*.html")
foreach ($file in $bombardirFiles) {
    $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    
    # Parse table rows: <tr> <td>Yer</td> <td>Oyunçu</td> <td>Sinif</td> <td>Qol</td> </tr>
    $pattern = '(?s)<tr>\s*<td><strong>.*?</strong></td>\s*<td>([^<]+)</td>\s*<td>([^<]+)</td>\s*<td>([^<]+)</td>\s*</tr>'
    $matchesObj = [regex]::Matches($content, $pattern)
    
    foreach ($m in $matchesObj) {
        $playerName = Clean-Name($m.Groups[1].Value)
        $className = $m.Groups[2].Value.Trim()
        $goalsVal = [int]$m.Groups[3].Value.Trim()
        
        $key = $playerName + "_" + $className
        if ($playersMap.ContainsKey($key)) {
            $playersMap[$key].goals = $goalsVal
        } else {
            # Player was not in roster list, add them!
            $div = Get-Division $className
            $playerId = "p_22_" + $playerName.ToLower().Replace(" ", "_") + "_" + $className.ToLower().Replace("/", "_")
            $playerId = $playerId -replace "[^a-z0-9_]", ""
            
            $playerObj = [PSCustomObject]@{
                id = $playerId
                name = $playerName
                class = $className
                division = $div
                year = "2022-2023"
                position = "Hücumçu"
                goals = $goalsVal
                assists = 0
                matchesPlayed = 0
                overallRating = 6.0
            }
            $players.Add($playerObj)
            $playersMap[$key] = $playerObj
            
            # Make sure class exists
            if (-not $classesMap.ContainsKey($className)) {
                $classId = "c_22_" + $className.ToLower().Replace("/", "_").Replace("-", "_")
                $classObj = [PSCustomObject]@{
                    id = $classId
                    name = $className
                    division = $div
                    year = "2022-2023"
                }
                $classes.Add($classObj)
                $classesMap[$className] = $classObj
            }
        }
    }
}

# 3. Parse Matches (oyunlar.html)
Write-Host "Parsing matches..."
$oyunlarHtml = [System.IO.File]::ReadAllText((Join-Path $rootPath "oyunlar.html"), [System.Text.Encoding]::UTF8)

# Tables are split by date or group
$tablePattern = '(?s)<table>([\s\S]*?)</table>'
$tableMatches = [regex]::Matches($oyunlarHtml, $tablePattern)

$matchIdCount = 1

foreach ($t in $tableMatches) {
    $tableContent = $t.Groups[1].Value
    
    # Get date from <th colspan="3">02.06.2023</th>
    $dateMatch = [regex]::Match($tableContent, '<th colspan="3">\s*([0-9\.]+)\s*</th>')
    $date = ""
    if ($dateMatch.Success) {
        $dateRaw = $dateMatch.Groups[1].Value.Trim()
        # Parse date from DD.MM.YYYY to YYYY-MM-DD
        if ($dateRaw -match '(\d{2})\.(\d{2})\.(\d{4})') {
            $date = "$($Matches[3])-$($Matches[2])-$($Matches[1])"
        } else {
            $date = $dateRaw
        }
    }
    
    # Parse each match row
    # <tr> <td style="...">TeamA</td> <td style="...">Score</td> <td style="...">TeamB</td> </tr>
    $rowPattern = '(?s)<tr>\s*<td[^>]*>([^<]+)</td>\s*<td[^>]*>([^<]+)</td>\s*<td[^>]*>([^<]+)</td>\s*</tr>'
    $rows = [regex]::Matches($tableContent, $rowPattern)
    
    foreach ($r in $rows) {
        $teamA = $r.Groups[1].Value.Trim()
        $scoreRaw = $r.Groups[2].Value.Trim()
        $teamB = $r.Groups[3].Value.Trim()
        
        if ($teamA -eq "Yer" -or $teamA -eq "Sinif") { continue } # skip table header row
        
        $div = Get-Division $teamA
        
        $scoreA = 0
        $scoreB = 0
        $penA = $null
        $penB = $null
        
        # Check for technical defeat
        if ($scoreRaw -match "Texniki məğlubiyyət\(([^)]+)\)") {
            $defeatedTeam = $Matches[1].Trim()
            if ($defeatedTeam -eq $teamA) {
                $scoreA = 0
                $scoreB = 3
            } else {
                $scoreA = 3
                $scoreB = 0
            }
        }
        # Check for penalty shootout score (e.g., "3(1) - 3(3)")
        elseif ($scoreRaw -match '^(\d+)\((\d+)\)\s*-\s*(\d+)\((\d+)\)$') {
            $scoreA = [int]$Matches[1]
            $penA = [int]$Matches[2]
            $scoreB = [int]$Matches[3]
            $penB = [int]$Matches[4]
        }
        # Normal score (e.g. "3 - 1" or "10 - 0")
        elseif ($scoreRaw -match '^(\d+)\s*-\s*(\d+)$') {
            $scoreA = [int]$Matches[1]
            $scoreB = [int]$Matches[2]
        }
        else {
            # Skip if score is invalid or unparsed
            continue
        }
        
        # Deduce stage
        $stage = "Qrup Mərhələsi"
        # If there are penalties, or if the date matches final tournament dates, it is a playoff
        if ($null -ne $penA -or $date -eq "2023-06-09" -or $date -eq "2023-06-07" -or $date -eq "2023-06-06") {
            if ($date -eq "2023-06-09" -or $date -eq "2023-06-23") {
                $stage = "Final"
            } elseif ($date -eq "2023-06-07" -or $date -eq "2023-06-22" -or $date -eq "2023-06-06") {
                $stage = "Yarımfinal"
            } else {
                $stage = "4/1 Final"
            }
        }
        
        # Build match stats (We'll generate ratings based on actual scorers to be Sofascore realistic!)
        $matchStats = [System.Collections.Generic.List[PSObject]]::new()
        
        # Let's find players in teamA and teamB that scored and assign goals to them inside matches
        # We can look up players belonging to teamA and teamB and distribute their goals
        
        $matchId = "m_22_" + ($matchIdCount++)
        
        $matchObj = [PSCustomObject]@{
            id = $matchId
            stage = $stage
            division = $div
            year = "2022-2023"
            teamA = $teamA
            teamB = $teamB
            scoreA = $scoreA
            scoreB = $scoreB
            penaltyScoreA = $penA
            penaltyScoreB = $penB
            date = $date
            videoUrl = "https://www.youtube.com/embed/dQw4w9WgXcQ"
            playerStats = $matchStats
        }
        $matchList.Add($matchObj)
        
        # Add classes to mapping if they are missing
        if (-not $classesMap.ContainsKey($teamA)) {
            $classId = "c_22_" + $teamA.ToLower().Replace("/", "_").Replace("-", "_")
            $classObj = [PSCustomObject]@{ id = $classId; name = $teamA; division = $div; year = "2022-2023" }
            $classes.Add($classObj)
            $classesMap[$teamA] = $classObj
        }
        if (-not $classesMap.ContainsKey($teamB)) {
            $classId = "c_22_" + $teamB.ToLower().Replace("/", "_").Replace("-", "_")
            $classObj = [PSCustomObject]@{ id = $classId; name = $teamB; division = Get-Division($teamB); year = "2022-2023" }
            $classes.Add($classObj)
            $classesMap[$teamB] = $classObj
        }
    }
}

# 4. Save to JSON
$archiveData = [PSCustomObject]@{
    classes = $classes
    players = $players
    matches = $matchList
}

$jsonText = $archiveData | ConvertTo-Json -Depth 100
[System.IO.File]::WriteAllText($outputPath, $jsonText, [System.Text.Encoding]::UTF8)

Write-Host "Archive generated successfully with $($classes.Count) classes, $($players.Count) players, and $($matchList.Count) matches!"
