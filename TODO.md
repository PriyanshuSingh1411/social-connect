# Fix Plan for API Errors

## Tasks:

- [x] 1. Fix models/User.js - Add TTL index on typingUsers.expiresAt
- [x] 2. Fix lib/auth.js - Reduce JWT token size
- [x] 3. Fix app/api/users/typing/route.js - Add cleanup and limit response size
- [x] 4. Fix app/api/users/online/route.js - Add similar improvements

## Status: Completed
