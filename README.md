# askSync | Intelligent Assessments

Automated AI-powered testing and form platform. Build, deploy, and grade evaluations at the speed of thought.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://asksync.amberbisht.me)
[![GitHub Repo](https://img.shields.io/badge/github-askSync-blue)](https://github.com/Amber-bisht/askSync)

## 🚀 Overview

**askSync** is a next-generation platform designed to revolutionize how assessments are created and graded. By leveraging advanced AI models like **Grok** and **Google Gemini**, askSync synthesizes complex reference materials into high-fidelity evaluations instantly.

Built with a focus on **minimalist, high-impact design** ("Antigravity" style), it provides a premium experience for both educators and students.

---

## ✨ Key Features

- **AI Synthesis Engine**: Automatically generate tests and forms from any reference material.
- **Intelligent Grading**: Real-time evaluation of subjective and objective responses using the Grok AI API.
- **Secure Access**: Integrated Google OAuth 2.0 for seamless and secure user authentication.
- **Interactive Backgrounds**: Premium UX elements including radial particle systems and fluid typography.
- **Access Control**: Robust "Access List" management for granular test visibility.
- **Payment Integration**: Seamless Razorpay integration for premium assessment tiers.
- **Mobile Responsive**: Architected for flawless performance across all device types.

---

## 🛠️ Technical Stack

- **Framework**: [Next.js 16+](https://nextjs.org/) (App Router, Turbopack)
- **Language**: TypeScript
- **Database**: MongoDB (via Mongoose)
- **Authentication**: NextAuth.js (Google Provider)
- **AI Models**: Grok SDK, Google Generative AI (Gemini)
- **Payments**: Razorpay
- **Animations**: Framer Motion

---

## ⚙️ Environment Configuration

To run askSync locally, create a `.env` file in the root directory and provide the following variables:

```env
# Database
MONGODB_URI=your_mongodb_connection_string

# Authentication (NextAuth)
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:5001
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5001/api/auth/callback/google

# AI Integration
GROQ_API_KEY=your_groq_api_key

# Payments
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

---

## 📦 Getting Started

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Amber-bisht/askSync.git
   cd askSync
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5001](http://localhost:5001) to view the result.

### Build and Deployment

**Production Build:**
```bash
npm run build
npm start
```

**Docker Deployment:**
```bash
docker build -t asksync .
docker run -p 5001:5001 asksync
```

---

## 👨‍💻 Built By

Crafted with ❤️ by **[amber bisht](https://amberbisht.me)**.

- **Portfolio**: [amberbisht.me](https://amberbisht.me)
- **Twitter/X**: [@amberbisht](https://twitter.com/amberbisht)
- **LinkedIn**: [amber-bisht](https://linkedin.com/in/amber-bisht)

---

## 📜 License

This project is private and proprietary. All rights reserved.
