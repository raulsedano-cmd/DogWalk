$url = "https://get.enterprisedb.com/postgresql/postgresql-16.1-1-windows-x64.exe"
$output = "postgresql-installer.exe"

Write-Host "Descargando PostgreSQL..."
Invoke-WebRequest -Uri $url -OutFile $output

Write-Host "Instalando PostgreSQL (esto puede tardar unos minutos)..."
# Argumentos para instalación silenciosa con contraseña 'postgres'
$args = "--mode unattended", "--superpassword postgres", "--servicepassword postgres"
Start-Process -FilePath $output -ArgumentList $args -Wait

Write-Host "Instalación completada."
