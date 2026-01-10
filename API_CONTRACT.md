# API Contract

## Endpoints
- `POST /challenges` - Create challenge (accepts `isLongTerm` field)
- `POST /challenges/join` - Join challenge
- `GET /challenges/{id}` - Get challenge details (includes `isLongTerm` and completion status)
- `GET /challenges/{id}/ranking` - Returns currentRank and previousRank for tendency (different logic for long-term)
- `GET /challenges/{id}/checks/today` - Returns userNames of participants who checked today
- `POST /challenges/{id}/complete` - Mark long-term challenge as complete for current user
- `DELETE /challenges/{id}/participants/{userId}` - Leave/Delete challenge
- `GET /users/{userId}/challenges` - Get user challenges (includes `participantCount`, `isLongTerm`, `completedAt`)
- `POST /users` - Update user profile (displayName)
- `POST /checks` - Sync daily check (or nudge for long-term challenges)
- `POST /checks/today/bulk` - Get today's checks for multiple challenges (bulk)
- `GET /users/{userId}/checks` - Get all checks for a user (for client sync on reinstall)
- `GET /health` - Server health check

## Notas
- userId enviado desde cliente
- inviteCode para unirse

## Errores
- 400 datos inválidos
- 404 reto no encontrado
