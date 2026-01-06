# Data Model

> **Note:** The authoritative data schema is now defined in `prisma/schema.prisma`.

## User
- id (String, UUID)
- displayName (String, defaults to anime-themed names like "Shadow Hokage")
- updatedAt (DateTime)

## Challenge
- id (String, UUID)
- title (String)
- description (String)
- points (Int, displayed as **Aura** in UI)
- duration (Int, total days)
- inviteCode (String, Unique)
- createdAt (DateTime)
- isPrivate (Boolean, default false)
- creatorId (String, FK User)

## Participant (Join Table)
- userId (FK User)
- challengeId (FK Challenge)
- joinedAt (DateTime)

## Check
- id (String, UUID)
- userId (FK User)
- challengeId (FK Challenge)
- date (String, YYYY-MM-DD)
- completed (Boolean)

## Relationships
- User N..M Challenge (via Participant)
- User 1..N Check
