// const fetch = require('node-fetch'); // Use global fetch

const API_URL = 'http://localhost:3000';

async function test() {
    try {
        // 1. Create Challenge
        const challengeRes = await fetch(`${API_URL}/challenges`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: 'Test Challenge', userId: 'user1', points: 10 })
        });
        const challenge = await challengeRes.json();
        console.log('Challenge created:', challenge.id);

        // 2. Create/Update Users
        await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: 'user1', displayName: 'Alice' })
        });
        await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: 'user2', displayName: 'Bob' })
        });
        console.log('Users created');

        // 3. Add Checks
        await fetch(`${API_URL}/checks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: 'user1', challengeId: challenge.id, date: '2023-01-01', completed: true })
        });
        await fetch(`${API_URL}/checks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: 'user2', challengeId: challenge.id, date: '2023-01-01', completed: true })
        });
        console.log('Checks added');

        // 4. Get Ranking
        const rankingRes = await fetch(`${API_URL}/challenges/${challenge.id}/ranking`);
        const ranking = await rankingRes.json();
        console.log('Ranking:', JSON.stringify(ranking, null, 2));

        // Verify
        const alice = ranking.find(r => r.userId === 'user1');
        const bob = ranking.find(r => r.userId === 'user2');

        if (alice && alice.displayName === 'Alice' && bob && bob.displayName === 'Bob') {
            console.log('SUCCESS: Display names are present in ranking');
        } else {
            console.error('FAILURE: Display names missing or incorrect');
            process.exit(1);
        }

    } catch (e) {
        console.error('Test failed', e);
        process.exit(1);
    }
}

test();
