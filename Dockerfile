# Στάδιο 1: Χτίσιμο
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app

# Αντιγράφουμε τα πάντα
COPY . .

# Μπαίνουμε στο σωστό βάθος του φακέλου
WORKDIR /app/backend/backend

# Χτίζουμε το jar αγνοώντας τα tests
RUN mvn clean package -DskipTests

# Στάδιο 2: Εκτέλεση
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Αντιγραφή του παραγόμενου jar
COPY --from=build /app/backend/backend/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]