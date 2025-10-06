// Dynamic user limits based on payment status
export const getUserLimits = (isPaid: boolean) => {
  if (isPaid) {
    // Paid user limits
    return {
      tests: {
        max: 100,
        period: 'monthly'
      },
      forms: {
        max: 10,
        period: 'monthly'
      },
      accessLists: {
        max: 10,
        period: 'monthly'
      },
      aiGrading: {
        max: 20,
        period: 'monthly'
      },
      mcqGeneration: {
        max: 100,
        period: 'monthly'
      },
      qaGeneration: {
        max: 100,
        period: 'monthly'
      }
    };
  } else {
    // Free user limits
    return {
      tests: {
        max: 5,
        period: 'total'
      },
      forms: {
        max: 5,
        period: 'total'
      },
      accessLists: {
        max: 1,
        period: 'total'
      },
      aiGrading: {
        max: 2,
        period: 'total'
      },
      mcqGeneration: {
        max: 10,
        period: 'total'
      },
      qaGeneration: {
        max: 10,
        period: 'total'
      }
    };
  }
};

// Helper function to update user limits when they become paid
export const updateUserToPaidLimits = () => {
  return {
    maxMonthlyTests: 100,
    maxMonthlyForms: 10,
    maxMonthlyAiGrading: 20,
    maxMonthlyMcq: 100,
    maxMonthlyQa: 100,
    maxMonthlyAccessLists: 10,
    // Reset monthly counters
    monthlyTestsUsed: 0,
    monthlyFormsUsed: 0,
    monthlyAccessListsUsed: 0,
    monthlyAiGradingUsed: 0,
    monthlyMcqUsed: 0,
    monthlyQaUsed: 0,
    currentMonthStart: new Date()
  };
};

// Helper function to get current usage vs limit
export const getUsageInfo = (user: Record<string, unknown>, limitType: string) => {
  const isPaid = user.isPaid;
  
  switch (limitType) {
    case 'tests':
      return {
        used: isPaid ? (user.monthlyTestsUsed || 0) : (user.testsCreated || 0),
        limit: isPaid ? (user.maxMonthlyTests || 100) : (user.maxFreeTests || 5),
        remaining: isPaid 
          ? Math.max(0, Number(user.maxMonthlyTests || 100) - Number(user.monthlyTestsUsed || 0))
          : Math.max(0, Number(user.maxFreeTests || 5) - Number(user.testsCreated || 0))
      };
    
    case 'forms':
      return {
        used: isPaid ? (user.monthlyFormsUsed || 0) : (user.formsCreated || 0),
        limit: isPaid ? (user.maxMonthlyForms || 10) : (user.maxFreeForms || 5),
        remaining: isPaid 
          ? Math.max(0, Number(user.maxMonthlyForms || 10) - Number(user.monthlyFormsUsed || 0))
          : Math.max(0, Number(user.maxFreeForms || 5) - Number(user.formsCreated || 0))
      };
    
    case 'accessLists':
      return {
        used: isPaid ? (user.monthlyAccessListsUsed || 0) : (user.accessListsCreated || 0),
        limit: isPaid ? (user.maxMonthlyAccessLists || 10) : (user.maxFreeAccessLists || 1),
        remaining: isPaid 
          ? Math.max(0, Number(user.maxMonthlyAccessLists || 10) - Number(user.monthlyAccessListsUsed || 0))
          : Math.max(0, Number(user.maxFreeAccessLists || 1) - Number(user.accessListsCreated || 0))
      };
    
    case 'aiGrading':
      return {
        used: isPaid ? (user.monthlyAiGradingUsed || 0) : (user.aiGradingUsed || 0),
        limit: isPaid ? (user.maxMonthlyAiGrading || 20) : (user.maxFreeAiGrading || 2),
        remaining: isPaid 
          ? Math.max(0, Number(user.maxMonthlyAiGrading || 20) - Number(user.monthlyAiGradingUsed || 0))
          : Math.max(0, Number(user.maxFreeAiGrading || 2) - Number(user.aiGradingUsed || 0))
      };
    
    case 'mcqGeneration':
      return {
        used: isPaid ? (user.monthlyMcqUsed || 0) : (user.freeMcqUsed || 0),
        limit: isPaid ? (user.maxMonthlyMcq || 100) : (user.maxFreeMcq || 10),
        remaining: isPaid 
          ? Math.max(0, Number(user.maxMonthlyMcq || 100) - Number(user.monthlyMcqUsed || 0))
          : Math.max(0, Number(user.maxFreeMcq || 10) - Number(user.freeMcqUsed || 0))
      };
    
    case 'qaGeneration':
      return {
        used: isPaid ? (user.monthlyQaUsed || 0) : (user.freeQaUsed || 0),
        limit: isPaid ? (user.maxMonthlyQa || 100) : (user.maxFreeQa || 10),
        remaining: isPaid 
          ? Math.max(0, Number(user.maxMonthlyQa || 100) - Number(user.monthlyQaUsed || 0))
          : Math.max(0, Number(user.maxFreeQa || 10) - Number(user.freeQaUsed || 0))
      };
    
    default:
      return { used: 0, limit: 0, remaining: 0 };
  }
};
