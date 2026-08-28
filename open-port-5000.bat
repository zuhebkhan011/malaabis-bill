@echo off
echo Adding Windows Firewall rule to allow Malaabis backend on port 5000...
netsh advfirewall firewall delete rule name="Malaabis Backend Port 5000" >nul 2>&1
netsh advfirewall firewall add rule name="Malaabis Backend Port 5000" dir=in action=allow protocol=TCP localport=5000
echo.
echo Done! Port 5000 is now open for local network connections.
pause
