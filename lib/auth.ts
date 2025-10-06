import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  session: {
    strategy: 'jwt', // Use JWT tokens stored in secure HTTP-only cookies
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ user, account }) {
      console.log('SignIn callback triggered:', { user: user.email, provider: account?.provider });
      
      if (account?.provider === 'google') {
        try {
          await connectDB();
          
          // Check if user exists
          const existingUser = await User.findOne({ email: user.email });
          
          if (existingUser) {
            console.log('Existing user found:', existingUser.email);
            // Update last login
            await User.findByIdAndUpdate(existingUser._id, {
              lastLoginAt: new Date(),
              name: user.name,
              image: user.image
            });
            return true;
          } else {
            console.log('Creating new user:', user.email);
            // Create new user
            await User.create({
              email: user.email,
              name: user.name,
              image: user.image
            });
            return true;
          }
        } catch (error) {
          console.error('Error in signIn callback:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        console.log('JWT callback - user data:', { email: user.email, id: user.id });
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        
        // Fetch user data from database
        try {
          await connectDB();
          const dbUser = await User.findOne({ email: user.email });
          if (dbUser) {
            console.log('JWT callback - dbUser data:', {
              email: dbUser.email,
              isPaid: dbUser.isPaid,
              accessListsLimit: dbUser.accessListsLimit,
              accessListsCreated: dbUser.accessListsCreated
            });
            token.userId = dbUser._id.toString();
            token.isPaid = dbUser.isPaid;
            token.subscriptionEndDate = dbUser.subscriptionEndDate;
            // Test limits
            token.testsCreated = dbUser.testsCreated;
            token.testsLimit = dbUser.testsLimit;
            // Form limits
            token.formsCreated = dbUser.formsCreated;
            token.formsLimit = dbUser.formsLimit;
            // Access list limits
            token.accessListsCreated = dbUser.accessListsCreated;
            token.accessListsLimit = dbUser.accessListsLimit;
            // AI grading limits
            token.aiGradingUsed = dbUser.aiGradingUsed;
            token.aiGradingLimit = dbUser.aiGradingLimit;
            // MCQ generation limits
            token.mcqAiUsed = dbUser.mcqAiUsed;
            token.mcqAiLimit = dbUser.mcqAiLimit;
            // Question/Answer generation limits
            token.questionAiUsed = dbUser.questionAiUsed;
            token.questionAiLimit = dbUser.questionAiLimit;
            // Expiry date
            token.expiryDate = dbUser.expiryDate;
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
      
      
      return token;
    },
    async session({ session, token }) {
      if (token) {
        console.log('Session callback - token data:', { 
          email: token.email, 
          userId: token.userId 
        });
        
        session.user.id = token.userId as string || token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.isPaid = token.isPaid as boolean;
        session.user.subscriptionEndDate = token.subscriptionEndDate as Date;
        // Test limits
        session.user.testsCreated = token.testsCreated as number;
        session.user.testsLimit = token.testsLimit as number;
        // Form limits
        session.user.formsCreated = token.formsCreated as number;
        session.user.formsLimit = token.formsLimit as number;
        // Access list limits
        session.user.accessListsCreated = token.accessListsCreated as number;
        session.user.accessListsLimit = token.accessListsLimit as number;
        // AI grading limits
        session.user.aiGradingUsed = token.aiGradingUsed as number;
        session.user.aiGradingLimit = token.aiGradingLimit as number;
        // MCQ generation limits
        session.user.mcqAiUsed = token.mcqAiUsed as number;
        session.user.mcqAiLimit = token.mcqAiLimit as number;
        // Question/Answer generation limits
        session.user.questionAiUsed = token.questionAiUsed as number;
        session.user.questionAiLimit = token.questionAiLimit as number;
        // Expiry date
        session.user.expiryDate = token.expiryDate as Date;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      console.log('Redirect callback:', { url, baseUrl });
      // Allow redirects to the same domain
      if (url.startsWith(baseUrl)) return url;
      // Allow redirects to relative URLs
      else if (url.startsWith('/')) return `${baseUrl}${url}`;
      return baseUrl;
    },
  },
  pages: {
    signIn: '/auth',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};
