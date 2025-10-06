import connectDB from './mongodb';
import { AccessList, IAccessList } from '@/models/AccessList';

interface AccessControlSettings {
  isPrivate: boolean;
  accessListId?: string;
  allowedEmails?: string[];
}

export async function validateUserAccess(
  userEmail: string | null,
  accessControl: AccessControlSettings
): Promise<{ hasAccess: boolean; reason?: string }> {
  // If not private, everyone has access
  if (!accessControl.isPrivate) {
    return { hasAccess: true };
  }

  // If private but no user email, deny access
  if (!userEmail) {
    return { 
      hasAccess: false, 
      reason: 'Authentication required for private access' 
    };
  }

  try {
    await connectDB();

    // Check access list if specified
    if (accessControl.accessListId) {
      const accessList = await AccessList.findById(accessControl.accessListId).lean() as IAccessList | null;
      
      if (!accessList || !accessList.isActive) {
        return { 
          hasAccess: false, 
          reason: 'Access list not found or inactive' 
        };
      }

      const userInList = accessList.users.some((user: { email: string }) => 
        user.email.toLowerCase() === userEmail.toLowerCase()
      );

      if (userInList) {
        // Update access tracking
        await AccessList.findOneAndUpdate(
          { 
            _id: accessControl.accessListId,
            'users.email': userEmail.toLowerCase()
          },
          {
            $set: {
              'users.$.lastAccessedAt': new Date()
            },
            $inc: {
              'users.$.accessCount': 1
            }
          }
        );

        return { hasAccess: true };
      }
    }

    // Check direct email list
    if (accessControl.allowedEmails && accessControl.allowedEmails.length > 0) {
      const emailAllowed = accessControl.allowedEmails.some(email => 
        email.toLowerCase() === userEmail.toLowerCase()
      );

      return { 
        hasAccess: emailAllowed,
        reason: emailAllowed ? undefined : 'Email not in allowed list'
      };
    }

    return { 
      hasAccess: false, 
      reason: 'No access method configured' 
    };

  } catch (error) {
    console.error('Error validating access:', error);
    return { 
      hasAccess: false, 
      reason: 'Access validation failed' 
    };
  }
}

export async function updateAccessListUsage(accessListId: string, increment: number = 1) {
  try {
    await connectDB();
    await AccessList.findByIdAndUpdate(
      accessListId,
      { $inc: { usageCount: increment } }
    );
  } catch (error) {
    console.error('Error updating access list usage:', error);
  }
}
