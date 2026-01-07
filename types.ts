export enum UserRole {
  ADMIN = 'ADMIN',
  LOANER = 'LOANER',
  LOANEE = 'LOANEE',
}

export enum LoanStatus {
  REQUESTED = 'REQUESTED',
  APPROVED_PENDING_CONFIRMATION = 'APPROVED_PENDING_CONFIRMATION', // Loaner uploaded proof, waiting for Loanee
  ACTIVE = 'ACTIVE', // Loanee confirmed receipt
  REPAYMENT_SUBMITTED = 'REPAYMENT_SUBMITTED',
  CLEARED = 'CLEARED',
  RESCINDED = 'RESCINDED',
  DEFAULTED = 'DEFAULTED',
}

export enum Currency {
  NGN = 'NGN',
  GHS = 'GHS',
}

export interface BankAccount {
  accountNumber: string;
  accountName: string;
  bankName: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  password?: string; // In a real app, never store plain text
  currency?: Currency; // For Loanee
  bankAccount?: BankAccount; // For Loanee
  isAcceptingLoans?: boolean; // For Loaner
  network?: string[]; // Array of User IDs (Loaners have Loanees, Loanees have Loaners)
  createdAt: string;
}

export interface Loan {
  id: string;
  loaneeId: string;
  loaneeName: string;
  loanerId: string;
  loanerName: string;
  amount: number;
  currency: Currency;
  status: LoanStatus;
  requestDate: string;
  dueDate: string;
  interestRate: number; // Annual %
  proofOfDisbursement?: string; // Base64 image string
  proofOfRepayment?: string; // Base64 image string
  clearedDate?: string;
  notes?: string;
}

export interface Invite {
  id: string;
  loanerId: string;
  loanerName: string;
  email: string; // The email invited
  status: 'PENDING' | 'ACCEPTED';
}
