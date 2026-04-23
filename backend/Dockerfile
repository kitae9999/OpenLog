FROM eclipse-temurin:21-jdk-jammy AS builder

WORKDIR /workspace

COPY gradlew gradlew.bat settings.gradle.kts ./
COPY gradle ./gradle
COPY backend/build.gradle.kts backend/build.gradle.kts
COPY backend/src backend/src

RUN chmod +x gradlew \
    && ./gradlew :backend:bootJar --no-daemon \
    && JAR_PATH="$(find backend/build/libs -maxdepth 1 -name '*.jar' ! -name '*-plain.jar' | head -n 1)" \
    && test -n "$JAR_PATH" \
    && cp "$JAR_PATH" /workspace/app.jar

FROM eclipse-temurin:21-jre-jammy

WORKDIR /app

COPY --from=builder /workspace/app.jar /app/app.jar

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
