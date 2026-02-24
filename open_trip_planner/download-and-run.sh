#!/usr/bin/env bash
# Download OTP JAR if missing, then start OTP with the graph in this directory.
# Default port 9080 to avoid conflict with Docker (8080/8081). Override with OTP_PORT=8080 if you prefer.
# Set OTP_URL=http://localhost:9080 in api/.env.local to match.
set -e
JAR="otp-shaded-2.8.1.jar"
URL="https://repo1.maven.org/maven2/org/opentripplanner/otp-shaded/2.8.1/otp-shaded-2.8.1.jar"
PORT="${OTP_PORT:-9080}"

if [ ! -f "$JAR" ]; then
  echo "Downloading $JAR..."
  curl -L -o "$JAR" "$URL"
fi

echo "Starting OpenTripPlanner on port $PORT..."
exec java -Xmx2G -jar "$JAR" --port "$PORT" --load .
