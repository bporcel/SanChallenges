# Data Model

> **Note:** The authoritative data schema is now defined in `server/prisma/schema.prisma`.

## User
- id (String, UUID)
- displayName (String, defaults to anime-themed names like "Shadow Hokage")
- updatedAt (DateTime)
- currentStreak (Int, defaults to 0) - Best active streak across all daily challenges
- lastCheckDate (String?, nullable) - Most recent check date for break detection
- previousStreak (Int, defaults to 0) - Previous streak for undo support

## Challenge
- id (String, UUID)
- title (String)
- description (String)
- points (Int, challenge-specific reward points)
- duration (Int, total days)
- inviteCode (String, Unique)
- createdAt (DateTime)
- isPrivate (Boolean, default false)
- isLongTerm (Boolean, default false) - Distinguishes goal-based long-term challenges
- creatorId (String, FK User)

## Participant (Join Table)
- userId (FK User)
- challengeId (FK Challenge)
- joinedAt (DateTime)
- completedAt (DateTime?, nullable) - When participant completed a long-term challenge

## Check
- id (String, UUID)
- userId (FK User)
- challengeId (FK Challenge)
- date (String, YYYY-MM-DD)
- completed (Boolean)

**Note:** For long-term challenges, Check records represent optional daily nudges (e.g., "Still working on it"). These nudges maintain engagement but do not affect ranking.

## Relationships
- User N..M Challenge (via Participant)
- User 1..N Check
