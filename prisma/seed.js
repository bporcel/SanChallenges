const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const DATA_FILE = path.join(__dirname, '../server/data.json');

async function main() {
    if (!fs.existsSync(DATA_FILE)) {
        console.log('No data.json found, skipping seed.');
        return;
    }

    const rawData = fs.readFileSync(DATA_FILE, 'utf8');
    const data = JSON.parse(rawData);

    console.log('Seeding Data...');

    // 1. Collect all unique User IDs
    const userMap = new Map(); // userId -> { id, displayName, updatedAt }

    // From users array
    if (data.users) {
        data.users.forEach(u => {
            userMap.set(u.id, {
                id: u.id,
                displayName: u.displayName,
                updatedAt: new Date(u.updatedAt)
            });
        });
    }

    // From participants
    if (data.participants) {
        data.participants.forEach(p => {
            if (!userMap.has(p.userId)) {
                userMap.set(p.userId, {
                    id: p.userId,
                    displayName: 'Unknown User',
                    updatedAt: new Date()
                });
            }
        });
    }

    // From checks
    if (data.checks) {
        data.checks.forEach(c => {
            if (!userMap.has(c.userId)) {
                userMap.set(c.userId, {
                    id: c.userId,
                    displayName: 'Unknown User',
                    updatedAt: new Date()
                });
            }
        });
    }

    // Upsert Users
    console.log(`Upserting ${userMap.size} users...`);
    for (const user of userMap.values()) {
        await prisma.user.upsert({
            where: { id: user.id },
            update: { displayName: user.displayName, updatedAt: user.updatedAt },
            create: { id: user.id, displayName: user.displayName, updatedAt: user.updatedAt },
        });
    }

    // Upsert Challenges
    console.log(`Upserting ${data.challenges?.length || 0} challenges...`);
    for (const challenge of data.challenges || []) {
        await prisma.challenge.upsert({
            where: { id: challenge.id },
            update: {
                title: challenge.title,
                description: challenge.description,
                points: challenge.points,
                inviteCode: challenge.inviteCode,
                createdAt: new Date(challenge.createdAt),
            },
            create: {
                id: challenge.id,
                title: challenge.title,
                description: challenge.description,
                points: challenge.points,
                inviteCode: challenge.inviteCode,
                createdAt: new Date(challenge.createdAt),
            },
        });
    }

    // Upsert Participants
    console.log(`Upserting ${data.participants?.length || 0} participants...`);
    for (const p of data.participants || []) {
        try {
            await prisma.participant.upsert({
                where: { userId_challengeId: { userId: p.userId, challengeId: p.challengeId } },
                update: { joinedAt: new Date(p.joinedAt) },
                create: {
                    userId: p.userId,
                    challengeId: p.challengeId,
                    joinedAt: new Date(p.joinedAt),
                },
            });
        } catch (e) {
            console.warn(`Skipping participant ${p.userId} in challenge ${p.challengeId}: ${e.message}`);
        }
    }

    // Upsert Checks
    console.log(`Upserting ${data.checks?.length || 0} checks...`);
    for (const check of data.checks || []) {
        try {
            await prisma.check.upsert({
                where: { id: check.id },
                update: { completed: check.completed, date: check.date },
                create: {
                    id: check.id,
                    userId: check.userId,
                    challengeId: check.challengeId,
                    date: check.date,
                    completed: check.completed
                }
            });
        } catch (e) {
            console.warn(`Skipping check ${check.id}: ${e.message}`);
        }
    }

    console.log('Seeding completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
