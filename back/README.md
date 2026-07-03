# Backend Spring Boot

v2 para CuentasClaras en Java + Spring Boot + PostgreSQL.

## Stack

- Spring Boot
- Controllers
- Services
- DTOs
- Datos mock en memoria (algunos)
- PostgresSQL

## Ejecutar

```bash

# levantás la DB (solo la primera vez o tras reiniciar)
docker compose up -d

#corrés el backend
./mvnw spring-boot:run

# Cuando terminás de trabajar
docker compose down   # para la DB (los datos se guardan igual por el volume)
```

## Endpoints (mockeados)

- `GET /api/health`
- `GET /api/grupos`
- `POST /api/grupos`
- `GET /api/dashboard/{grupoId}`
- `GET /api/balance/{grupoId}`
- `POST /api/gastos`
- `POST /api/pagos`

## Endpoints funcionando
- `POST /api/usuarios/registro`
- `GET /api/usuarios`
- `GET /api/usuarios/{id}`
- `DELETE /api/usuarios/{id}`

- `POST /api/consortiums`
- `GET /api/consortiums`
- `GET /api/consortiums/{id}`
- `POST /api/consortiums/{id}/members`
- `POST /api/consortiums/{id}/members/{userId}/promote`
- `POST /api/consortiums/{id}/members/{userId}/demote`
- `DELETE /api/consortiums/{id}/members/{userId}`
- `DELETE /api/consortiums/{id}/members/me`

## Para cargar deploy

```bash
git checkout main
git subtree split --prefix=back -b back-branch
git push -f back-origin back-branch:main
```


