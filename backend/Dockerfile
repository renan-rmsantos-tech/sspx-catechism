# Multi-stage build → tiny static image for the Go API.
FROM golang:1.23-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /api ./cmd/api

FROM gcr.io/distroless/static-debian12:nonroot
WORKDIR /
COPY --from=build /api /api
# distroless has no shell/wget; the compose healthcheck runs `/api -healthcheck`,
# which probes /api/health from inside the binary.
EXPOSE 8080
USER nonroot:nonroot
ENTRYPOINT ["/api"]
