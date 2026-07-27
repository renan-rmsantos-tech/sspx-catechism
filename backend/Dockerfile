# Multi-stage build -> tiny static image for the Go API.
FROM golang:1.25-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
# Portão de testes: substitui o job `test` do GitHub Actions. Se um teste quebra,
# a imagem não constrói e o `compose up` aborta — o container antigo segue servindo.
# Os testes de integração dão t.Skip sem TEST_DATABASE_URL, igual ao CI antigo.
RUN go test ./...
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /api ./cmd/api

FROM gcr.io/distroless/static-debian12:nonroot
WORKDIR /
COPY --from=build /api /api
# distroless has no shell/wget; the compose healthcheck runs `/api -healthcheck`,
# which probes /api/health from inside the binary.
EXPOSE 8080
USER nonroot:nonroot
ENTRYPOINT ["/api"]
