# AarambhApp Backend

A unified backend server for the AarambhApp English Learning Platform.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB running locally or connection string
- Environment variables configured

### Installation
```bash
npm install
```

### Environment Setup
Copy `env.example` to `env.local` and configure:
```bash
cp env.example env.local
# Edit env.local with your configuration
```

### Running the Server

#### Development Mode (with auto-reload)
```bash
npm run dev
```

#### Production Mode
```bash
npm start
```

## 📚 Available Endpoints

The server provides a comprehensive API with the following modules:

### 🔐 Authentication (`/api/auth`)
- User registration and login
- Password management
- JWT token handling

### 👥 Users (`/api/users`)
- User management
- Profile updates
- Admin user operations

### 🌍 Regions (`/api/regions`)
- Regional management
- Public region listing
- Regional statistics

### 📖 Lectures (`/api/lectures`)
- Video lecture management
- Public lecture access
- View tracking and analytics

### 🎮 Games (`/api/games`)
- Multiple game types (grammar, pronunciation, identification, storytelling)
- Game sessions and scoring
- Public game access

### 🏆 Leaderboard (`/api/leaderboard`)
- Regional rankings
- Global top performers
- User rank tracking

### 💰 Transactions (`/api/transactions`)
- Subscription management
- Payment processing (Razorpay)
- Transaction history

### 📞 Communication (`/api/communication`)
- Video call management
- Chat functionality
- Session handling

### 🔗 Referrals (`/api/referrals`)
- Teacher referral system
- Discount management
- Referral tracking

### 👨‍💼 Admin (`/api/admin`)
- Administrative operations
- System statistics
- User management

## 🧪 Testing

### Health Check
```bash
curl http://localhost:5000/health
```

### API Documentation
```bash
curl http://localhost:5000/test
```

## 🔧 Configuration

### Environment Variables
- `PORT`: Server port (default: 5000)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: JWT signing secret
- `NODE_ENV`: Environment (development/production)

### CORS Configuration
The server is configured to support:
- Expo development servers
- Web browsers
- Mobile emulators
- Cross-platform development

## 📁 Project Structure

```
BackEnd/
├── server.js              # Main unified server file
├── config/                # Configuration files
├── middleware/            # Express middleware
├── models/                # Mongoose models
├── routes/                # API route handlers
├── controllers/           # Business logic
├── utils/                 # Utility functions
└── scripts/               # Database seeding scripts
```

## 🚨 Important Notes

- **Single Server**: All functionality is now consolidated into one `server.js` file
- **No More Multiple Servers**: Previous separate server files have been removed
- **Unified API**: All endpoints are available through one server instance
- **Cross-Platform**: Supports web, iOS, and Android development

## 🔍 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Kill existing process
   pkill -f "node server.js"
   # Or change port in env.local
   ```

2. **MongoDB Connection Failed**
   - Ensure MongoDB is running
   - Check connection string in `env.local`

3. **CORS Issues**
   - Server supports multiple origins
   - Check if your frontend URL is in the allowed list

### Logs
The server provides detailed logging for debugging:
- Request/response logging
- Error tracking
- Database connection status

## 📞 Support

For issues or questions, check the logs and ensure all environment variables are properly configured.
