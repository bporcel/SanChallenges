# API Contract

## Endpoints
POST /challenges
POST /challenges/join
GET /challenges/{id}
POST /checks
GET /challenges/{id}/ranking
GET /challenges/{id}/checks/today
DELETE /challenges/{id}/participants/{userId}

## Notas
- userId enviado desde cliente
- inviteCode para unirse

## Errores
- 400 datos inválidos
- 404 reto no encontrado
