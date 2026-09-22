@echo off
set "JAVA_HOME=C:\Users\mrnam\AppData\Local\Programs\jdk-17.0.20.1+1"
set "PATH=%JAVA_HOME%\bin;C:\Users\mrnam\AppData\Local\Programs\apache-maven-3.9.9\bin;%PATH%"
echo Starting Spring Boot Backend on http://localhost:8080...
echo Swagger UI will be available at http://localhost:8080/swagger-ui.html
mvn spring-boot:run
pause
