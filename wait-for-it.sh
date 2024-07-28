#!/usr/bin/env bash

set -e

HOST="$1"
PORT="$2"
shift 2
CMD="$@"

until nc -z "$HOST" "$PORT"; do
  >&2 echo "Waiting for $HOST:$PORT..."
  sleep 1
done

>&2 echo "$HOST:$PORT is available - executing command"
exec $CMD
