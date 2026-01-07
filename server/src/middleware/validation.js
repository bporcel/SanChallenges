const { z } = require('zod');

// Validation schemas for different endpoints
const schemas = {
    createChallenge: z.object({
        title: z.string().min(1).max(100),
        description: z.string().max(500).optional(),
        points: z.number().int().min(0).max(1000).optional(),
        duration: z.number().int().min(1).max(365).optional(),
        userId: z.string().uuid(),
        isPrivate: z.boolean().optional(),
        isLongTerm: z.boolean().optional(),
        displayName: z.string().min(1).max(100).optional()
    }),

    joinChallenge: z.object({
        inviteCode: z.string().length(6),
        userId: z.string().uuid(),
        displayName: z.string().min(1).max(100).optional()
    }),

    createCheck: z.object({
        id: z.string().uuid().optional(),
        userId: z.string().uuid(),
        challengeId: z.string().uuid(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        completed: z.boolean().optional()
    }),

    updateUser: z.object({
        id: z.string().uuid(),
        displayName: z.string().min(1).max(100)
    }),

    bulkCheckIns: z.object({
        challengeIds: z.array(z.string().uuid()).min(1).max(50)
    }),

    completeChallenge: z.object({
        userId: z.string().uuid()
    })
};

// Middleware factory that validates request body against a schema
const validate = (schemaName) => {
    return (req, res, next) => {
        const schema = schemas[schemaName];
        if (!schema) {
            return res.status(500).json({ error: 'Invalid validation schema' });
        }

        try {
            req.body = schema.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: error.errors.map(e => ({
                        field: e.path.join('.'),
                        message: e.message
                    }))
                });
            }
            next(error);
        }
    };
};

module.exports = { validate, schemas };
