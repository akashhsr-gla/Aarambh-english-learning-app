# AarambhApp Backend

A comprehensive backend API for the AarambhApp English learning platform, built with Node.js, Express, and MongoDB.

## Features

### 🎮 Games Management
- **Unified Game Model**: Single model handles all game types (Grammar, Pronunciation, Identification, Storytelling)
- **Flexible Question Structure**: Supports multiple choice, true/false, fill-in-blank, audio, image, and video questions
- **Admin Control**: Admins can create, edit, and manage game content
- **Statistics Tracking**: Tracks game performance, completion rates, and user engagement

### 📞 Communication Features
- **Video Calls**: One-to-one and group video calling
- **Voice Calls**: Audio-only communication
- **Chat System**: Individual and group chat functionality
- **Session Management**: Comprehensive tracking of all communication sessions

### 🎓 Learning Content
- **Video Lectures**: Upload and manage educational videos with descriptions and notes
- **Resource Management**: PDF notes, additional materials, and supplementary content
- **Progress Tracking**: Monitor student engagement and completion rates

### 💳 Payment & Subscription
- **Razorpay Integration**: Secure payment processing
- **Subscription Plans**: Flexible plan management with different durations and features
- **Referral System**: 25% discount for students using teacher referral codes
- **Transaction Tracking**: Complete payment history and analytics

### 👥 User Management
- **Multi-Role System**: Admin, Teacher, and Student roles
- **Region-Based Organization**: Users organized by geographical regions
- **Profile Management**: Comprehensive user profiles with learning statistics

### 🏆 Leaderboards
- **Regional Rankings**: Top 3 students per region
- **Multiple Timeframes**: Weekly, monthly, and overall leaderboards
- **Game-Specific Rankings**: Separate leaderboards for each game type
- **Performance Metrics**: Average scores, session counts, and engagement metrics

### 📊 Admin Dashboard
- **Content Management**: CRUD operations for all content types
- **User Management**: Complete user administration
- **Analytics**: Comprehensive platform statistics
- **Feature Control**: Manage which features are paid vs free

## Database Models

### 1. User Model
- **Unified Design**: Handles admin, teacher, and student roles
- **Role-Specific Fields**: Different information for each user type
- **Statistics Tracking**: Game scores, session counts, learning progress
- **Referral System**: Teacher referral codes and student usage tracking

### 2. Region Model
- **Geographical Organization**: Manage different regions
- **Statistics**: Track user counts and performance by region
- **Leaderboard Support**: Regional leaderboard calculations

### 3. Plan Model
- **Subscription Plans**: Flexible pricing and duration options
- **Feature Control**: Define which features are included in each plan
- **Razorpay Integration**: Payment gateway configuration

### 4. Transaction Model
- **Payment Tracking**: Complete Razorpay transaction history
- **Referral Discounts**: Track discount applications
- **Subscription Management**: Link transactions to user subscriptions

### 5. Game Model
- **Unified Structure**: Single model for all game types
- **Flexible Questions**: Support for various question formats
- **Admin Management**: Content creation and editing capabilities
- **Performance Analytics**: Track game statistics and user engagement

### 6. VideoLecture Model
- **Content Management**: Video uploads with descriptions and notes
- **Resource Attachments**: PDF notes and supplementary materials
- **Instructor Tracking**: Link lectures to specific teachers
- **Engagement Metrics**: View counts, completion rates, and ratings

### 7. Session Model
- **Communication Tracking**: All video calls, voice calls, and chat sessions
- **Participant Management**: Track who joined, left, and session duration
- **Game Sessions**: Special handling for game-based sessions
- **Analytics**: Session statistics and engagement metrics

### 8. Leaderboard Model
- **Regional Rankings**: Top 3 students per region
- **Time-Based**: Weekly, monthly, and overall leaderboards
- **Game-Specific**: Separate rankings for each game type
- **Performance Metrics**: Comprehensive scoring and statistics

### 9. Referral Model
- **Teacher Referrals**: Unique referral codes for teachers
- **Discount System**: 25% discount for referred students
- **Usage Tracking**: Monitor referral code usage and effectiveness
- **Revenue Analytics**: Track earnings from referrals

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user (admin)
- `DELETE /api/users/:id` - Delete user (admin)
- `GET /api/users` - Get all users (admin)

### Regions
- `GET /api/regions` - Get all regions
- `POST /api/regions` - Create region (admin)
- `PUT /api/regions/:id` - Update region (admin)
- `DELETE /api/regions/:id` - Delete region (admin)

### Plans
- `GET /api/plans` - Get all plans
- `POST /api/plans` - Create plan (admin)
- `PUT /api/plans/:id` - Update plan (admin)
- `DELETE /api/plans/:id` - Delete plan (admin)

### Transactions
- `POST /api/transactions/create-order` - Create Razorpay order
- `POST /api/transactions/verify-payment` - Verify payment
- `GET /api/transactions/user` - Get user transactions
- `GET /api/transactions` - Get all transactions (admin)

### Games
- `GET /api/games` - Get all games
- `GET /api/games/:id` - Get game by ID
- `POST /api/games` - Create game (admin)
- `PUT /api/games/:id` - Update game (admin)
- `DELETE /api/games/:id` - Delete game (admin)
- `POST /api/games/:id/submit-score` - Submit game score

### Lectures
- `GET /api/lectures` - Get all lectures
- `GET /api/lectures/:id` - Get lecture by ID
- `POST /api/lectures` - Create lecture (admin/teacher)
- `PUT /api/lectures/:id` - Update lecture (admin/teacher)
- `DELETE /api/lectures/:id` - Delete lecture (admin/teacher)

### Sessions
- `POST /api/sessions/create` - Create new session
- `GET /api/sessions/user` - Get user sessions
- `PUT /api/sessions/:id/join` - Join session
- `PUT /api/sessions/:id/leave` - Leave session
- `PUT /api/sessions/:id/end` - End session

### Leaderboards
- `GET /api/leaderboards/region/:regionId` - Get regional leaderboard
- `GET /api/leaderboards/game/:gameType` - Get game-specific leaderboard
- `POST /api/leaderboards/update` - Update leaderboard (admin)

### Referrals
- `POST /api/referrals/validate` - Validate referral code
- `GET /api/referrals/teacher/:teacherId` - Get teacher referrals
- `POST /api/referrals/use` - Use referral code

### Admin
- `GET /api/admin/dashboard` - Admin dashboard statistics
- `GET /api/admin/users` - User management
- `GET /api/admin/transactions` - Transaction analytics
- `GET /api/admin/sessions` - Session analytics

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd BackEnd
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Database setup**
   ```bash
   # Make sure MongoDB is running
   # The app will automatically create collections
   ```

5. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## Environment Variables

Create a `.env` file with the following variables:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/aarambhapp

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=30d

# Razorpay Configuration
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-secret-key

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## API Documentation

The API follows RESTful conventions and returns JSON responses. All endpoints require authentication unless specified otherwise.

### Response Format
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### Error Format
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt password encryption
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS Protection**: Cross-origin resource sharing configuration
- **Helmet Security**: Security headers middleware
- **Input Validation**: Request validation and sanitization

## Performance Features

- **Database Indexing**: Optimized MongoDB indexes for fast queries
- **Compression**: Response compression for faster data transfer
- **Connection Pooling**: MongoDB connection pooling
- **Caching**: Redis caching for frequently accessed data

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team.
