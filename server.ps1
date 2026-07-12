# Custom PowerShell TCP Listener Web Server for Sandbox Environments
# Serves static files and sets correct MIME Content-Types to support ESM imports without HTTP.sys dependencies

$port = 8080
$localPath = Get-Item .
$listener = New-Object System.Net.Sockets.TcpListener ([System.Net.IPAddress]::Any), $port
$listener.Start()

Write-Host "Listening on http://localhost:$port/ ..."
Write-Host "Press Ctrl+C to stop."

while ($true) {
    try {
        $client = $listener.AcceptTcpClient()
        $stream = $client.GetStream()
        
        # Read request header
        $buffer = New-Object byte[] 1024
        $bytesRead = $stream.Read($buffer, 0, $buffer.Length)
        $requestText = [System.Text.Encoding]::UTF8.GetString($buffer, 0, $bytesRead)
        
        if ($requestText.Length -eq 0) {
            $client.Close()
            continue
        }
        
        $firstLine = ($requestText -split "`r`n")[0]
        $parts = $firstLine -split " "
        if ($parts.Length -lt 2) {
            $client.Close()
            continue
        }
        
        $url = $parts[1]
        # Remove query parameters if present
        $url = ($url -split "\?")[0]
        
        if ($url -eq "/") { $url = "/index.html" }
        if ($url -eq "/admin-secret-gate" -or $url.EndsWith("/admin-secret-gate")) { $url = "/index.html" }
        
        # Prevent directory traversal
        $urlCleaned = $url.Replace("..", "").TrimStart("/")
        $filePath = [System.IO.Path]::Combine($localPath.FullName, $urlCleaned)
        
        if (Test-Path $filePath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            
            # Content Type Mapping
            $contentType = "application/octet-stream"
            if ($url.EndsWith(".html")) {
                $contentType = "text/html; charset=utf-8"
            } elseif ($url.EndsWith(".js")) {
                $contentType = "application/javascript; charset=utf-8"
            } elseif ($url.EndsWith(".css")) {
                $contentType = "text/css; charset=utf-8"
            } elseif ($url.EndsWith(".svg")) {
                $contentType = "image/svg+xml"
            } elseif ($url.EndsWith(".png")) {
                $contentType = "image/png"
            } elseif ($url.EndsWith(".jpg") -or $url.EndsWith(".jpeg")) {
                $contentType = "image/jpeg"
            }
            
            # Write Response Headers
            $headers = "HTTP/1.1 200 OK`r`nContent-Type: $contentType`r`nContent-Length: $($bytes.Length)`r`nConnection: close`r`nAccess-Control-Allow-Origin: *`r`n`r`n"
            $headerBytes = [System.Text.Encoding]::UTF8.GetBytes($headers)
            
            $stream.Write($headerBytes, 0, $headerBytes.Length)
            $stream.Write($bytes, 0, $bytes.Length)
        } else {
            $errMsg = "404 Not Found"
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes($errMsg)
            $headers = "HTTP/1.1 404 Not Found`r`nContent-Type: text/plain`r`nContent-Length: $($errBytes.Length)`r`nConnection: close`r`n`r`n"
            $headerBytes = [System.Text.Encoding]::UTF8.GetBytes($headers)
            
            $stream.Write($headerBytes, 0, $headerBytes.Length)
            $stream.Write($errBytes, 0, $errBytes.Length)
        }
        
        $stream.Flush()
        $client.Close()
    } catch {
        # Catch and ignore request errors to keep server running
    }
}
