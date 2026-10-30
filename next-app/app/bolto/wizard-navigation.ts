import { sections } from './draft';

export const wizardSteps = [
  { ...sections.template, label: 'Template', section: 'template' },
  { ...sections.candidate, label: 'Candidate & Role', section: 'candidate' },
  { ...sections.compensation, label: 'Compensation', section: 'compensation' },
  { ...sections.hire, label: 'Hire Setup', section: 'hire' },
  { ...sections.terms, label: 'Offer Terms & Sender', section: 'terms' },
  { href: '/bolto', label: 'Review & Send', section: null },
] as const;
