#!/bin/sh

# Line blocks build-time environment variables in a way that we can inject them at runtime.
# This script reads environment variables and writes them to env-config.js.

# Load local .env values so NEXT_PUBLIC_* variables are available.
if [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi

# Destination file
ENV_CONFIG_FILE="${1:-./public/env-config.js}"
echo "Generating $ENV_CONFIG_FILE..."

# Recreate the file
echo "window._env_ = {" > $ENV_CONFIG_FILE

# List of environment variables to inject.
# We will inject all environment variables that start with NEXT_PUBLIC_
# You can add others manually if needed.

# Find all environment variables starting with NEXT_PUBLIC_
# and format them as "key: \"value\","
env | grep '^NEXT_PUBLIC_' | while read -r line; do
  # Extract key and value
  key=$(echo "$line" | cut -d '=' -f 1)
  value=$(echo "$line" | cut -d '=' -f 2-)
  
  # Append to file
  echo "  $key: \"$value\"," >> $ENV_CONFIG_FILE
done

# End the object
echo "};" >> $ENV_CONFIG_FILE

echo "Generated $ENV_CONFIG_FILE"
