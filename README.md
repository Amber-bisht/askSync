# AskSync

A full-stack multiple-choice quiz platform where users can generate MCQs using Google Gemini AI, configure test settings, and take tests via shared test links with Google authentication.

## Features

### For Users
- Generate MCQs using Google Gemini AI
- Create custom tests with configurable settings
- Share test links for others to take
- Track test results and performance
- Role-based access control (User/Admin)

### For Admins
- All user features plus platform-wide management
- View platform statistics and user analytics
- Manage user accounts and roles
- Monitor system usage and performance

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, MongoDB with Mongoose
- **Authentication**: NextAuth.js with Google OAuth
- **AI Integration**: Google Gemini AI for MCQ generation
- **Payment**: Razorpay integration
- **Deployment**: Vercel-ready

## Project Structure

```
testapp/
├── app/                    # Next.js 14 app directory
│   ├── api/               # API routes
│   │   ├── admin/         # Admin-only endpoints
│   │   ├── auth/          # Authentication endpoints
│   │   ├── payment/       # Payment processing
│   │   ├── tests/         # Test management
│   │   └── generate-mcq/  # AI MCQ generation
│   ├── dashboard/         # Main dashboard for test creation and management
│   ├── admin/             # Admin dashboard
│   ├── auth/              # Authentication pages
│   └── test/              # Test taking interface
├── components/             # Reusable React components
├── models/                 # MongoDB schemas
├── lib/                    # Utility functions
├── types/                  # TypeScript type definitions
└── scripts/                # Utility scripts
```

## User Workflow

1. **Authentication**: Sign in with Google OAuth
2. **Role Assignment**: Users start with 'user' role, can be promoted to 'admin'
3. **Test Creation**: Users can create tests using AI-generated MCQs
4. **Test Taking**: Users can take tests via shared links
5. **Results**: View test results and performance analytics

## Admin Workflow

1. **Platform Management**: Access to all user features
2. **Statistics**: View platform-wide usage statistics
3. **User Management**: Monitor and manage user accounts
4. **System Oversight**: Track platform performance and usage

## API Endpoints

### Authentication
- `POST /api/auth/[...nextauth]` - NextAuth.js endpoints
- `POST /api/auth/update-role` - Update user role

### Test Management
- `POST /api/tests` - Create new test
- `GET /api/tests` - Get tests by link or creator

### AI Integration
- `POST /api/generate-mcq` - Generate MCQs using Gemini AI

### Payment Processing
- `POST /api/payment/create-order` - Create payment order
- `POST /api/payment/verify` - Verify payment
- `POST /api/payment/create-test-order` - Create test creation payment
- `POST /api/payment/verify-test-creation` - Verify test creation payment

### Admin
- `GET /api/admin/stats` - Get platform statistics

## Environment Variables

Create a `.env.local` file with:

```env
MONGODB_URI=your_mongodb_connection_string
GOOGLE_GEMINI_API_KEY=your_gemini_api_key
NEXTAUTH_SECRET=your_nextauth_secret
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
NEXTAUTH_URL=http://localhost:5000
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/callback/google
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd testapp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   # Edit .env.local with your actual values
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Open [http://localhost:5000](http://localhost:5000)
   - Sign in with Google OAuth
   - Start creating and taking tests!

## Role System

- **User**: Can take tests, create tests (within limits), view personal results
- **Admin**: All user features plus platform management, statistics, and user oversight

## Payment System

- **Free Tier**: Limited MCQ generation and test creation
- **Paid Plans**: Monthly/Yearly subscriptions for unlimited access
- **Pay-per-Test**: Additional test creation beyond free limits

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
