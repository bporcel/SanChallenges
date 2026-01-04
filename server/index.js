const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
app.use(express.json());
app.use(cors());

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', time: Date.now() });
});

const DATA_FILE = path.join(__dirname, 'data.json');

// Helper to read/write data
const db = {
    read: () => {
        if (!fs.existsSync(DATA_FILE)) {
            return { challenges: [], participants: [], checks: [], users: [] };
        }
        const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        if (!data.users) data.users = []; // Migration
        return data;
    },
    write: (data) => {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    }
};

// Generate 6-char invite code
const generateInviteCode = () => {
    return crypto.randomBytes(3).toString('hex').toUpperCase();
};

// POST /challenges - Create new challenge
app.post('/challenges', (req, res) => {
    console.log('Creating challenge with body:', req.body);
    const { title, description, points, userId } = req.body;
    if (!title || !userId) return res.status(400).json({ error: 'Missing fields' });

    const data = db.read();
    const newChallenge = {
        id: crypto.randomUUID(),
        title,
        description: description || '',
        points: points || 0,
        inviteCode: generateInviteCode(),
        createdAt: Date.now()
    };

    data.challenges.push(newChallenge);

    // Auto-join creator
    data.participants.push({
        userId,
        challengeId: newChallenge.id,
        joinedAt: Date.now()
    });

    db.write(data);
    res.json(newChallenge);
});

// POST /challenges/join - Join via code
app.post('/challenges/join', (req, res) => {
    const { inviteCode, userId } = req.body;
    if (!inviteCode || !userId) return res.status(400).json({ error: 'Missing fields' });

    const data = db.read();
    const challenge = data.challenges.find(c => c.inviteCode === inviteCode);

    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });

    const existing = data.participants.find(p => p.userId === userId && p.challengeId === challenge.id);
    if (!existing) {
        data.participants.push({
            userId,
            challengeId: challenge.id,
            joinedAt: Date.now()
        });
        db.write(data);
    }

    res.json(challenge);
});

// GET /challenges/:id - Get challenge details
app.get('/challenges/:id', (req, res) => {
    const data = db.read();
    const challenge = data.challenges.find(c => c.id === req.params.id);
    if (!challenge) return res.status(404).json({ error: 'Not found' });
    res.json(challenge);
});

// POST /users - Update user profile
app.post('/users', (req, res) => {
    const { id, displayName } = req.body;
    if (!id || !displayName) return res.status(400).json({ error: 'Missing fields' });

    const data = db.read();
    const existingIndex = data.users.findIndex(u => u.id === id);

    const newUser = { id, displayName, updatedAt: Date.now() };

    if (existingIndex >= 0) {
        data.users[existingIndex] = newUser;
    } else {
        data.users.push(newUser);
    }

    db.write(data);
    res.json(newUser);
});

// POST /checks - Sync check
app.post('/checks', (req, res) => {
    const { id, userId, challengeId, date, completed } = req.body;
    if (!userId || !challengeId || !date) return res.status(400).json({ error: 'Missing fields' });

    const data = db.read();

    // Remove existing check for same day/user/challenge if exists
    const existingIndex = data.checks.findIndex(c =>
        c.userId === userId &&
        c.challengeId === challengeId &&
        c.date === date
    );

    const newCheck = {
        id: id || crypto.randomUUID(),
        userId,
        challengeId,
        date,
        completed: completed !== false // default true
    };

    if (existingIndex >= 0) {
        data.checks[existingIndex] = newCheck;
    } else {
        data.checks.push(newCheck);
    }

    db.write(data);
    res.json(newCheck);
});

// GET /challenges/:id/ranking
app.get('/challenges/:id/ranking', (req, res) => {
    const { id } = req.params;
    const data = db.read();

    // Filter checks for this challenge
    const challengeChecks = data.checks.filter(c => c.challengeId === id && c.completed);

    // Group by user
    const ranking = {};
    challengeChecks.forEach(c => {
        if (!ranking[c.userId]) ranking[c.userId] = 0;
        ranking[c.userId]++;
    });

    // Convert to array and join with user data
    const result = Object.entries(ranking)
        .map(([userId, count]) => {
            const user = data.users.find(u => u.id === userId);
            return {
                userId,
                count,
                displayName: user ? user.displayName : null
            };
        })
        .sort((a, b) => b.count - a.count);

    res.json(result);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
