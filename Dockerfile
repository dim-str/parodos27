# Στάδιο 1: Χτίσιμο
FROM maven:3.8.5-eclipse-temurin-17 AS build
WORKDIR /app

# Αντιγράφουμε τα πάντα από το repository
COPY . .

# Μπαίνουμε στη σωστή διαδρομή (διπλό backend)
WORKDIR /app/backend/backend

# Χτίζουμε το project
RUN mvn clean package -DskipTests

# Στάδιο 2: Εκτέλεση
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Παίρνουμε το jar από τη νέα σωστή διαδρομή
COPY --from=build /app/backend/backend/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]