# Frontend

[![Build Status](https://drone.contc/api/badges/ContinuousC/Frontend/status.svg)](https://drone.contc/ContinuousC/Frontend)

Frontend is the GUI part of the C9C application.

The frontend consistent of following pages:

Segment 1 - SRE/Operations:

Goals is to quickly draw a picture of what problems there are and where you need to debug

- Dashboard overview for the status of the layers
- Alerts for all open alerts

Segment 2 - [Layers](./layers.md):

Goal is to go deeper into the problem area by debugging and finding the root cause.

- Kubernetes
- Applications

Segment 3 - 3rd party tools:

If layers are not enough to find the problem, you can go deeper in the opensource 3rd party tools to find root cause.

- Grafana GUI
- Prometheus GUI
- Jaeger GUI
- Opensearch GUI

Segment 4 - settings:

- [Configuration](./configuration.md)
- Edit Packages
- [Help](./help-and-account.md#help)
- [Account](./help-and-account.md#account)

## Folder structure

- Components: are elements that are used within pages
- hooks
- layout: forms the main layout of our gui, sidebar and content
- pages
- state: Here we manage or global state with use redux-toolkit
- test
- types
- utils
- App.tsx
- constants.ts
- context.ts: react context to avoid prop drilling
- errors.ts
- main.tsx
- services.ts: functions to wrap our api calls
