FROM eclipse-temurin:21-jre-jammy

WORKDIR /app

COPY backend/build/libs/app.jar /app/app.jar

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
