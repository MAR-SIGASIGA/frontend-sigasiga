#!/bin/bash
set -e

IMAGE_NAME=frontend-sigasiga-prod
TAG=latest
REGISTRY=localhost:32000

# Construir la imagen
docker build -t $IMAGE_NAME:$TAG .
# Etiquetar la imagen
docker tag $IMAGE_NAME:$TAG $REGISTRY/$IMAGE_NAME:$TAG
# Pushear la imagen a la registry local
docker push $REGISTRY/$IMAGE_NAME:$TAG 