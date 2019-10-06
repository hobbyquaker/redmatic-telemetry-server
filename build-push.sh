#!/bin/bash

IMAGE_ID=$(docker build -q . 2>/dev/null | awk '/Successfully built/{print $NF}')

echo "IMAGE_ID=$IMAGE_ID"

docker tag $IMAGE_ID hobbyquaker/redmatic-telemetry-server:latest

docker push hobbyquaker/redmatic-telemetry-server:latest

