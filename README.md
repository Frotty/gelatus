# Gelatus Mono Repo

- Frontend using Typescript and Phaser
- Backend using Typescript and Express + Socket.io

## Prerequisites

Make sure you have node.js Version 14+ installed
Run `npm i` to install dependencies.

## Running the Frontend

Run `npm run start:dev` for a live reload frontend instance.
A browser tab should open at `localhost:8080`.

## Running the backend

Run `npm run server:dev` to compile the backend to javascript and run that with node. No live reload currently.

## How to Build the Site

Run `npm run build` after modifying code to populate the **public** directory with the final site contents.
This is required for sharing the frontend with other players. After building the app use

`npm run ngrok`

Which will give you a URL where other players can connect to.

## Upgrading Phaser

To upgrade Phaser 3 run `npm upgrade phaser`.
