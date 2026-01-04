# Data Model

> **Note:** The authoritative data schema is now defined in `prisma/schema.prisma`.

## User
- id (String, UUID)
- displayName (String)
- updatedAt (DateTime)

## Challenge
- id (String, UUID)
- title (String)
- description (String)
- points (Int)
- inviteCode (String, Unique)
- createdAt (DateTime)

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
