# Στάδιο 1: Χτίσιμο (Build)
# Χρησιμοποιούμε Eclipse Temurin για το χτίσιμο
FROM maven:3.8.5-eclipse-temurin-17 AS build
WORKDIR /app

# Αντιγράφουμε τα αρχεία (έχοντας ως Root Directory το 'backend')
COPY pom.xml .
COPY src ./src

RUN mvn clean package -DskipTests

# Στάδιο 2: Εκτέλεση (Run)
# Χρησιμοποιούμε μια ελαφριά εικόνα Eclipse Temurin για το τρέξιμο
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]