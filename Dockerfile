# Στάδιο 1: Χτίσιμο
FROM maven:3.8.5-eclipse-temurin-17 AS build
WORKDIR /app

# Αντιγράφουμε τα αρχεία από τον φάκελο backend
COPY backend/pom.xml ./backend/
COPY backend/src ./backend/src

# Μπαίνουμε μέσα στον φάκελο για το build
WORKDIR /app/backend
RUN mvn clean package -DskipTests

# Στάδιο 2: Εκτέλεση
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
# Προσοχή: το jar παράγεται μέσα στο backend/target
COPY --from=build /app/backend/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]