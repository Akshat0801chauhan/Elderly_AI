FROM openjdk:17-jdk-slim

WORKDIR /app

COPY . .

RUN apt-get update && apt-get install -y maven
RUN mvn clean install -DskipTests

EXPOSE 8080

CMD ["java", "-jar", "target/*.jar"]