import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      image?: string
      isPaid: boolean
      subscriptionEndDate?: Date
      isTrialUsed?: boolean
      // Test limits
      testsCreated: number
      testsLimit: number
      maxFreeTests?: number
      monthlyTestsUsed?: number
      maxMonthlyTests?: number
      // Form limits
      formsCreated: number
      formsLimit: number
      maxFreeForms?: number
      monthlyFormsUsed?: number
      maxMonthlyForms?: number
      // Access list limits
      accessListsCreated: number
      accessListsLimit: number
      maxFreeAccessLists?: number
      monthlyAccessListsUsed?: number
      maxMonthlyAccessLists?: number
      // AI grading limits
      aiGradingUsed: number
      aiGradingLimit: number
      maxFreeAiGrading?: number
      monthlyAiGradingUsed?: number
      maxMonthlyAiGrading?: number
      // MCQ generation limits
      mcqAiUsed: number
      mcqAiLimit: number
      freeMcqUsed?: number
      maxFreeMcq?: number
      monthlyMcqUsed?: number
      maxMonthlyMcq?: number
      // Question/Answer generation limits
      questionAiUsed: number
      questionAiLimit: number
      freeQaUsed?: number
      maxFreeQa?: number
      monthlyQaUsed?: number
      maxMonthlyQa?: number
      // Expiry date
      expiryDate?: Date
    }
  }

  interface User {
    id: string
    email: string
    name: string
    image?: string
    isPaid: boolean
    subscriptionEndDate?: Date
    isTrialUsed?: boolean
    // Test limits
    testsCreated: number
    testsLimit: number
    maxFreeTests?: number
    monthlyTestsUsed?: number
    maxMonthlyTests?: number
    // Form limits
    formsCreated: number
    formsLimit: number
    maxFreeForms?: number
    monthlyFormsUsed?: number
    maxMonthlyForms?: number
    // Access list limits
    accessListsCreated: number
    accessListsLimit: number
    maxFreeAccessLists?: number
    monthlyAccessListsUsed?: number
    maxMonthlyAccessLists?: number
    // AI grading limits
    aiGradingUsed: number
    aiGradingLimit: number
    maxFreeAiGrading?: number
    monthlyAiGradingUsed?: number
    maxMonthlyAiGrading?: number
    // MCQ generation limits
    mcqAiUsed: number
    mcqAiLimit: number
    freeMcqUsed?: number
    maxFreeMcq?: number
    monthlyMcqUsed?: number
    maxMonthlyMcq?: number
    // Question/Answer generation limits
    questionAiUsed: number
    questionAiLimit: number
    freeQaUsed?: number
    maxFreeQa?: number
    monthlyQaUsed?: number
    maxMonthlyQa?: number
    // Expiry date
    expiryDate?: Date
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    email: string
    name: string
    image?: string
    userId: string
    isPaid: boolean
    subscriptionEndDate?: Date
    isTrialUsed?: boolean
    // Test limits
    testsCreated: number
    testsLimit: number
    maxFreeTests?: number
    monthlyTestsUsed?: number
    maxMonthlyTests?: number
    // Form limits
    formsCreated: number
    formsLimit: number
    maxFreeForms?: number
    monthlyFormsUsed?: number
    maxMonthlyForms?: number
    // Access list limits
    accessListsCreated: number
    accessListsLimit: number
    maxFreeAccessLists?: number
    monthlyAccessListsUsed?: number
    maxMonthlyAccessLists?: number
    // AI grading limits
    aiGradingUsed: number
    aiGradingLimit: number
    maxFreeAiGrading?: number
    monthlyAiGradingUsed?: number
    maxMonthlyAiGrading?: number
    // MCQ generation limits
    mcqAiUsed: number
    mcqAiLimit: number
    freeMcqUsed?: number
    maxFreeMcq?: number
    monthlyMcqUsed?: number
    maxMonthlyMcq?: number
    // Question/Answer generation limits
    questionAiUsed: number
    questionAiLimit: number
    freeQaUsed?: number
    maxFreeQa?: number
    monthlyQaUsed?: number
    maxMonthlyQa?: number
    // Expiry date
    expiryDate?: Date
  }
}