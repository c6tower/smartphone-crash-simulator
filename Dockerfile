FROM node:22-alpine

WORKDIR /app

COPY ./vite-project/package*.json /app/vite-project/

WORKDIR /app/vite-project

RUN npm install

COPY . /app
