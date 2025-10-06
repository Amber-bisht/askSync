import { IFormField } from '@/models/Form';

export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  type: 'feedback' | 'inquiry' | 'complaint' | 'custom' | 'survey';
  icon: string;
  fields: Omit<IFormField, 'id'>[];
}

export const formTemplates: FormTemplate[] = [
  {
    id: 'customer-feedback',
    name: 'Customer Feedback',
    description: 'Collect customer satisfaction and feedback',
    type: 'feedback',
    icon: '⭐',
    fields: [
      {
        type: 'text',
        label: 'Full Name',
        placeholder: 'Enter your full name',
        required: true,
        validation: { minLength: 2, maxLength: 100 }
      },
      {
        type: 'email',
        label: 'Email Address',
        placeholder: 'your.email@example.com',
        required: true
      },
      {
        type: 'rating',
        label: 'Overall Satisfaction',
        required: true,
        validation: { min: 1, max: 5 }
      },
      {
        type: 'select',
        label: 'How did you hear about us?',
        required: false,
        options: ['Social Media', 'Search Engine', 'Friend Referral', 'Advertisement', 'Website', 'Other']
      },
      {
        type: 'textarea',
        label: 'What did you like most?',
        placeholder: 'Tell us what you enjoyed...',
        required: false,
        validation: { maxLength: 500 }
      },
      {
        type: 'textarea',
        label: 'What could we improve?',
        placeholder: 'Share your suggestions...',
        required: false,
        validation: { maxLength: 500 }
      },
      {
        type: 'checkbox',
        label: 'Which features do you use? (Select all that apply)',
        required: false,
        options: ['Mobile App', 'Website', 'Customer Support', 'Online Ordering', 'Notifications']
      },
      {
        type: 'radio',
        label: 'Would you recommend us to others?',
        required: true,
        options: ['Definitely', 'Probably', 'Not Sure', 'Probably Not', 'Definitely Not']
      }
    ]
  },
  {
    id: 'general-inquiry',
    name: 'General Inquiry',
    description: 'General questions and information requests',
    type: 'inquiry',
    icon: '❓',
    fields: [
      {
        type: 'text',
        label: 'Full Name',
        placeholder: 'Enter your full name',
        required: true,
        validation: { minLength: 2, maxLength: 100 }
      },
      {
        type: 'email',
        label: 'Email Address',
        placeholder: 'your.email@example.com',
        required: true
      },
      {
        type: 'text',
        label: 'Phone Number',
        placeholder: '+1 (555) 123-4567',
        required: false,
        validation: { pattern: '^[\\+]?[0-9\\s\\-\\(\\)]+$' }
      },
      {
        type: 'select',
        label: 'Inquiry Type',
        required: true,
        options: ['Product Information', 'Service Details', 'Pricing', 'Technical Support', 'Partnership', 'Media Inquiry', 'Other']
      },
      {
        type: 'text',
        label: 'Subject',
        placeholder: 'Brief subject of your inquiry',
        required: true,
        validation: { minLength: 5, maxLength: 200 }
      },
      {
        type: 'textarea',
        label: 'Message',
        placeholder: 'Please provide details about your inquiry...',
        required: true,
        validation: { minLength: 10, maxLength: 1000 }
      },
      {
        type: 'radio',
        label: 'Preferred Response Method',
        required: true,
        options: ['Email', 'Phone Call', 'Text Message']
      },
      {
        type: 'select',
        label: 'Response Urgency',
        required: false,
        options: ['Low - Within a week', 'Medium - Within 2-3 days', 'High - Within 24 hours', 'Urgent - ASAP']
      }
    ]
  },
  {
    id: 'complaint-form',
    name: 'Complaint Form',
    description: 'Report issues and complaints',
    type: 'complaint',
    icon: '⚠️',
    fields: [
      {
        type: 'text',
        label: 'Full Name',
        placeholder: 'Enter your full name',
        required: true,
        validation: { minLength: 2, maxLength: 100 }
      },
      {
        type: 'email',
        label: 'Email Address',
        placeholder: 'your.email@example.com',
        required: true
      },
      {
        type: 'text',
        label: 'Phone Number',
        placeholder: '+1 (555) 123-4567',
        required: false,
        validation: { pattern: '^[\\+]?[0-9\\s\\-\\(\\)]+$' }
      },
      {
        type: 'date',
        label: 'Date of Incident',
        required: true
      },
      {
        type: 'select',
        label: 'Complaint Category',
        required: true,
        options: ['Product Quality', 'Service Issue', 'Billing Problem', 'Staff Behavior', 'Website/App Issue', 'Delivery Problem', 'Other']
      },
      {
        type: 'rating',
        label: 'Severity Level (1 = Minor, 5 = Critical)',
        required: true,
        validation: { min: 1, max: 5 }
      },
      {
        type: 'text',
        label: 'Order/Reference Number',
        placeholder: 'If applicable, enter order or reference number',
        required: false,
        validation: { maxLength: 50 }
      },
      {
        type: 'textarea',
        label: 'Detailed Description',
        placeholder: 'Please describe the issue in detail, including what happened, when, and any relevant circumstances...',
        required: true,
        validation: { minLength: 20, maxLength: 2000 }
      },
      {
        type: 'textarea',
        label: 'What resolution are you seeking?',
        placeholder: 'Describe what outcome or resolution you would like...',
        required: false,
        validation: { maxLength: 500 }
      },
      {
        type: 'checkbox',
        label: 'Have you tried any of these solutions?',
        required: false,
        options: ['Contacted customer service', 'Checked FAQ/Help section', 'Tried troubleshooting', 'Spoke with manager/supervisor']
      },
      {
        type: 'radio',
        label: 'Is this your first complaint with us?',
        required: false,
        options: ['Yes', 'No']
      }
    ]
  },
  {
    id: 'event-feedback',
    name: 'Event Feedback',
    description: 'Collect feedback about events and experiences',
    type: 'feedback',
    icon: '🎉',
    fields: [
      {
        type: 'text',
        label: 'Full Name',
        placeholder: 'Enter your full name',
        required: true,
        validation: { minLength: 2, maxLength: 100 }
      },
      {
        type: 'email',
        label: 'Email Address',
        placeholder: 'your.email@example.com',
        required: true
      },
      {
        type: 'text',
        label: 'Event Name',
        placeholder: 'Which event did you attend?',
        required: true,
        validation: { minLength: 2, maxLength: 200 }
      },
      {
        type: 'date',
        label: 'Event Date',
        required: true
      },
      {
        type: 'rating',
        label: 'Overall Event Rating',
        required: true,
        validation: { min: 1, max: 5 }
      },
      {
        type: 'rating',
        label: 'Content Quality',
        required: true,
        validation: { min: 1, max: 5 }
      },
      {
        type: 'rating',
        label: 'Organization & Setup',
        required: true,
        validation: { min: 1, max: 5 }
      },
      {
        type: 'select',
        label: 'How did you learn about this event?',
        required: false,
        options: ['Social Media', 'Email Newsletter', 'Website', 'Friend/Colleague', 'Advertisement', 'Other']
      },
      {
        type: 'textarea',
        label: 'What did you like most?',
        placeholder: 'Tell us the best parts of the event...',
        required: false,
        validation: { maxLength: 500 }
      },
      {
        type: 'textarea',
        label: 'What could be improved?',
        placeholder: 'Share your suggestions for improvement...',
        required: false,
        validation: { maxLength: 500 }
      },
      {
        type: 'radio',
        label: 'Would you attend future events?',
        required: true,
        options: ['Definitely', 'Probably', 'Maybe', 'Probably Not', 'No']
      },
      {
        type: 'checkbox',
        label: 'What topics interest you for future events?',
        required: false,
        options: ['Technology', 'Business', 'Marketing', 'Design', 'Leadership', 'Innovation', 'Networking']
      }
    ]
  },
  {
    id: 'job-application',
    name: 'Job Application',
    description: 'Comprehensive job application form for recruitment',
    type: 'inquiry',
    icon: '💼',
    fields: [
      {
        type: 'text',
        label: 'Full Name',
        placeholder: 'Enter your full name',
        required: true,
        validation: { minLength: 2, maxLength: 100 }
      },
      {
        type: 'email',
        label: 'Email Address',
        placeholder: 'your.email@example.com',
        required: true
      },
      {
        type: 'text',
        label: 'Phone Number',
        placeholder: '+1 (555) 123-4567',
        required: true,
        validation: { pattern: '^[\\+]?[0-9\\s\\-\\(\\)]+$' }
      },
      {
        type: 'text',
        label: 'LinkedIn Profile',
        placeholder: 'https://linkedin.com/in/yourprofile',
        required: false,
        validation: { maxLength: 200 }
      },
      {
        type: 'text',
        label: 'Position Applied For',
        placeholder: 'e.g., Software Engineer, Marketing Manager',
        required: true,
        validation: { minLength: 2, maxLength: 100 }
      },
      {
        type: 'select',
        label: 'How did you hear about this position?',
        required: false,
        options: ['Company Website', 'LinkedIn', 'Job Board', 'Referral', 'Social Media', 'Recruiter', 'Other']
      },
      {
        type: 'text',
        label: 'Current Location',
        placeholder: 'City, State/Country',
        required: true,
        validation: { minLength: 2, maxLength: 100 }
      },
      {
        type: 'radio',
        label: 'Are you willing to relocate?',
        required: true,
        options: ['Yes', 'No', 'Maybe']
      },
      {
        type: 'select',
        label: 'Highest Level of Education',
        required: true,
        options: ['High School', 'Associate Degree', 'Bachelor\'s Degree', 'Master\'s Degree', 'PhD', 'Professional Certification', 'Other']
      },
      {
        type: 'text',
        label: 'University/Institution',
        placeholder: 'Name of your university or institution',
        required: false,
        validation: { maxLength: 150 }
      },
      {
        type: 'text',
        label: 'Degree/Field of Study',
        placeholder: 'e.g., Computer Science, Business Administration',
        required: false,
        validation: { maxLength: 100 }
      },
      {
        type: 'number',
        label: 'Years of Experience',
        required: true,
        validation: { min: 0, max: 50 }
      },
      {
        type: 'textarea',
        label: 'Previous Work Experience',
        placeholder: 'Briefly describe your relevant work experience...',
        required: true,
        validation: { minLength: 50, maxLength: 1000 }
      },
      {
        type: 'checkbox',
        label: 'Technical Skills (Select all that apply)',
        required: false,
        options: ['JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'AWS', 'Docker', 'Git', 'Project Management', 'Digital Marketing', 'Data Analysis']
      },
      {
        type: 'textarea',
        label: 'Why do you want to work here?',
        placeholder: 'Tell us what interests you about our company...',
        required: true,
        validation: { minLength: 100, maxLength: 500 }
      },
      {
        type: 'textarea',
        label: 'Tell us about yourself',
        placeholder: 'Brief personal introduction and career highlights...',
        required: true,
        validation: { minLength: 100, maxLength: 500 }
      },
      {
        type: 'select',
        label: 'Expected Salary Range (Annual)',
        required: false,
        options: ['Under $40,000', '$40,000 - $60,000', '$60,000 - $80,000', '$80,000 - $100,000', '$100,000 - $120,000', '$120,000 - $150,000', 'Above $150,000', 'Negotiable']
      },
      {
        type: 'select',
        label: 'Preferred Work Arrangement',
        required: true,
        options: ['Remote', 'On-site', 'Hybrid', 'No preference']
      },
      {
        type: 'date',
        label: 'Earliest Start Date',
        required: true
      },
      {
        type: 'radio',
        label: 'Do you require work authorization/visa sponsorship?',
        required: true,
        options: ['Yes', 'No']
      },
      {
        type: 'textarea',
        label: 'Additional Comments or Questions',
        placeholder: 'Any additional information you\'d like to share...',
        required: false,
        validation: { maxLength: 500 }
      },
      {
        type: 'checkbox',
        label: 'Agreements',
        required: true,
        options: ['I confirm that all information provided is accurate', 'I agree to background verification if selected', 'I consent to being contacted regarding this application']
      }
    ]
  },
  {
    id: 'service-request',
    name: 'Service Request',
    description: 'Request services or support',
    type: 'inquiry',
    icon: '🛠️',
    fields: [
      {
        type: 'text',
        label: 'Full Name',
        placeholder: 'Enter your full name',
        required: true,
        validation: { minLength: 2, maxLength: 100 }
      },
      {
        type: 'email',
        label: 'Email Address',
        placeholder: 'your.email@example.com',
        required: true
      },
      {
        type: 'text',
        label: 'Company/Organization',
        placeholder: 'Your company name',
        required: false,
        validation: { maxLength: 100 }
      },
      {
        type: 'text',
        label: 'Phone Number',
        placeholder: '+1 (555) 123-4567',
        required: true,
        validation: { pattern: '^[\\+]?[0-9\\s\\-\\(\\)]+$' }
      },
      {
        type: 'select',
        label: 'Service Type',
        required: true,
        options: ['Technical Support', 'Maintenance', 'Installation', 'Consultation', 'Training', 'Custom Development', 'Other']
      },
      {
        type: 'select',
        label: 'Priority Level',
        required: true,
        options: ['Low', 'Medium', 'High', 'Critical']
      },
      {
        type: 'date',
        label: 'Preferred Start Date',
        required: false
      },
      {
        type: 'textarea',
        label: 'Service Description',
        placeholder: 'Describe the service you need in detail...',
        required: true,
        validation: { minLength: 20, maxLength: 1000 }
      },
      {
        type: 'text',
        label: 'Budget Range',
        placeholder: 'e.g., $1000-$5000',
        required: false,
        validation: { maxLength: 50 }
      },
      {
        type: 'radio',
        label: 'Timeline Flexibility',
        required: true,
        options: ['Very Flexible', 'Somewhat Flexible', 'Fixed Timeline', 'Urgent']
      }
    ]
  }
];

export const getTemplateById = (id: string): FormTemplate | undefined => {
  return formTemplates.find(template => template.id === id);
};

export const getTemplatesByType = (type: string): FormTemplate[] => {
  return formTemplates.filter(template => template.type === type);
};
