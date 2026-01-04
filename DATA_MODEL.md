# Data Model

## User
- id (UUID local)
- displayName (required)

## Challenge
- id
- title
- description
- points
- inviteCode

## Participation
- userId
- challengeId
- joinedAt

## Check
- id
- userId
- challengeId
- date
- completed

## Relaciones
- User N..M Challenge (via Participation)
- User 1..N Check
