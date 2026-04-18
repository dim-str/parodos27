# Στάδιο 1: Χτίσιμο
FROM maven:3.8.5-eclipse-temurin-17 AS build
WORKDIR /app

# Αντιγράφουμε ΤΑ ΠΑΝΤΑ από το repository μέσα στο container
COPY . .

# Μπαίνουμε στον φάκελο backend (εκεί που είναι το pom.xml)
WORKDIR /app/backend

# Χτίζουμε το project
RUN mvn clean package -DskipTests

# Στάδιο 2: Εκτέλεση
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Παίρνουμε το έτοιμο jar από τον φάκελο που χτίστηκε
COPY --from=build /app/backend/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]