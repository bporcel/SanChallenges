# Challenge Tracker App

## Propósito y contexto
App móvil Android para trackear retos compartidos entre amigos, sincronizada online y basada en confianza.

## Qué hace la app
- Crear retos compartidos
- Unirse a retos existentes mediante invitación
- Marcar cumplimiento diario
- Ranking compartido entre participantes
- Sistema de **Aura** (puntos con temática anime)
- Duración de retos personalizable (dinámica)

## Público objetivo
Grupos pequeños de amigos que quieren compartir retos sin fricción ni cuentas.

## Stack
- **Frontend**: React Native (Expo)
- **Backend**: Node.js + Express
- **Database**: PostgreSQL + Prisma
- **Hosting**: Render (Docker)
- **Coste objetivo**: 0 (Free Tier)

## Ejecutar en local

### Prerrequisitos
- Node.js
- Docker (para la base de datos)

### Pasos
1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Configurar entorno**:
   Crea un archivo `.env` en la raíz con:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5433/sanchallenges"
   EXPO_PUBLIC_API_URL="http://localhost:3000"
   ```

3. **Iniciar servidor (Backend)**:
   ```bash
   npm run server
   ```
   *Este comando levanta Docker, espera a la DB, sincroniza el esquema y arranca el servidor.*

4. **Iniciar app (Frontend)**:
   ```bash
   npm start
   ```

### Otros comandos útiles
- `npm run db:studio`: Abre una interfaz web para visualizar y editar los datos de la base de datos.
- `npm run db:reset`: Borra todo y recrea la base de datos desde cero.
