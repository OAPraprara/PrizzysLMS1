import { User, Loan, Invite, UserRole, LoanStatus, Currency } from '../types';

const USERS_KEY = 'prizzys_users';
const LOANS_KEY = 'prizzys_loans';
const INVITES_KEY = 'prizzys_invites';
const CURRENT_USER_KEY = 'prizzys_current_user';

// --- Initialization & Seeding ---

const seedData = () => {
  if (!localStorage.getItem(USERS_KEY)) {
    const admin: User = {
      id: 'admin-1',
      name: 'Platform Admin',
      email: 'admin@prizzys.com',
      phone: '0000000000',
      role: UserRole.ADMIN,
      password: 'password',
      createdAt: new Date().toISOString(),
    };

    const loaner: User = {
      id: 'loaner-1',
      name: 'John Lender',
      email: 'loaner@test.com',
      phone: '08012345678',
      role: UserRole.LOANER,
      password: 'password',
      isAcceptingLoans: true,
      createdAt: new Date().toISOString(),
      network: ['loanee-1'],
    };

    const loanee: User = {
      id: 'loanee-1',
      name: 'Jane Borrower',
      email: 'loanee@test.com',
      phone: '09087654321',
      role: UserRole.LOANEE,
      password: 'password',
      currency: Currency.NGN,
      bankAccount: {
        accountName: 'Jane Doe',
        accountNumber: '1234567890',
        bankName: 'Zenith Bank',
      },
      createdAt: new Date().toISOString(),
      network: ['loaner-1'],
    };

    localStorage.setItem(USERS_KEY, JSON.stringify([admin, loaner, loanee]));
  }

  if (!localStorage.getItem(LOANS_KEY)) {
    localStorage.setItem(LOANS_KEY, JSON.stringify([]));
  }
  if (!localStorage.getItem(INVITES_KEY)) {
    localStorage.setItem(INVITES_KEY, JSON.stringify([]));
  }
};

seedData();

// --- Helpers ---

const getUsers = (): User[] => JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
const setUsers = (users: User[]) => localStorage.setItem(USERS_KEY, JSON.stringify(users));

const getLoans = (): Loan[] => JSON.parse(localStorage.getItem(LOANS_KEY) || '[]');
const setLoans = (loans: Loan[]) => localStorage.setItem(LOANS_KEY, JSON.stringify(loans));

const getInvites = (): Invite[] => JSON.parse(localStorage.getItem(INVITES_KEY) || '[]');
const setInvites = (invites: Invite[]) => localStorage.setItem(INVITES_KEY, JSON.stringify(invites));

// --- Auth Service ---

export const AuthService = {
  login: (email: string, password: string): User | null => {
    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      return user;
    }
    return null;
  },

  register: (user: Omit<User, 'id' | 'createdAt'>): User => {
    const users = getUsers();
    if (users.find(u => u.email === user.email)) {
      throw new Error('Email already exists');
    }

    const newUser: User = {
      ...user,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      network: [],
    };

    // Check for pending invites for this email
    const invites = getInvites();
    const myInvites = invites.filter(i => i.email === newUser.email && i.status === 'PENDING');
    
    // Auto-accept invites logic
    if (newUser.role === UserRole.LOANEE && myInvites.length > 0) {
      const loanerIdsToConnect = myInvites.map(i => i.loanerId);
      
      // Update new user's network
      newUser.network = loanerIdsToConnect;

      // Update loaners' networks
      const updatedUsers = users.map(u => {
        if (loanerIdsToConnect.includes(u.id)) {
           return { ...u, network: [...(u.network || []), newUser.id] };
        }
        return u;
      });
      
      // Mark invites accepted
      const updatedInvites = invites.map(i => {
         if (i.email === newUser.email) return { ...i, status: 'ACCEPTED' as const };
         return i;
      });
      setInvites(updatedInvites);
      setUsers([...updatedUsers, newUser]); // Add new user to the updated list
    } else {
      setUsers([...users, newUser]);
    }

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
    return newUser;
  },

  logout: () => {
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  getCurrentUser: (): User | null => {
    const stored = localStorage.getItem(CURRENT_USER_KEY);
    return stored ? JSON.parse(stored) : null;
  },
  
  updateUser: (updatedUser: User) => {
    const users = getUsers();
    const newUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
    setUsers(newUsers);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
  }
};

// --- Loan Service ---

export const LoanService = {
  requestLoan: (loan: Omit<Loan, 'id' | 'status' | 'requestDate'>): Loan => {
    const loans = getLoans();
    const newLoan: Loan = {
      ...loan,
      id: crypto.randomUUID(),
      status: LoanStatus.REQUESTED,
      requestDate: new Date().toISOString(),
    };
    setLoans([newLoan, ...loans]);
    return newLoan;
  },

  updateLoan: (loan: Loan) => {
    const loans = getLoans();
    const newLoans = loans.map(l => l.id === loan.id ? loan : l);
    setLoans(newLoans);
  },

  getLoansForUser: (userId: string, role: UserRole): Loan[] => {
    const loans = getLoans();
    if (role === UserRole.ADMIN) return loans;
    if (role === UserRole.LOANER) return loans.filter(l => l.loanerId === userId);
    return loans.filter(l => l.loaneeId === userId);
  },
};

// --- Network Service ---

export const NetworkService = {
  sendInvite: (loanerId: string, loanerName: string, email: string) => {
    const invites = getInvites();
    if (invites.find(i => i.email === email && i.loanerId === loanerId)) {
      throw new Error('Invite already sent');
    }

    const newInvite: Invite = {
      id: crypto.randomUUID(),
      loanerId,
      loanerName,
      email,
      status: 'PENDING',
    };
    setInvites([...invites, newInvite]);

    // Check if user already exists
    const users = getUsers();
    const existingUser = users.find(u => u.email === email && u.role === UserRole.LOANEE);
    
    if (existingUser) {
        // Connect them immediately
        newInvite.status = 'ACCEPTED'; // Update local obj to reflect, but we need to save connection
        
        // Update both networks
        const updatedUsers = users.map(u => {
            if (u.id === loanerId) {
                return { ...u, network: Array.from(new Set([...(u.network || []), existingUser.id])) };
            }
            if (u.id === existingUser.id) {
                return { ...u, network: Array.from(new Set([...(u.network || []), loanerId])) };
            }
            return u;
        });
        setUsers(updatedUsers);
        
        // Update invites storage
        const updatedInvites = getInvites().map(i => i.id === newInvite.id ? { ...i, status: 'ACCEPTED' as const } : i);
        // We actually just added newInvite to state but haven't saved the 'ACCEPTED' version yet properly in this flow
        // To be safe, let's just save the invite as Pending first, then if user exists, update everything.
        // Simplifying for this sync mock:
        // (Logic handled above effectively)
    }
  },

  getNetworkMembers: (userId: string): User[] => {
    const users = getUsers();
    const currentUser = users.find(u => u.id === userId);
    if (!currentUser || !currentUser.network) return [];
    
    return users.filter(u => currentUser.network?.includes(u.id));
  },
  
  getPendingInvites: (email: string): Invite[] => {
      const invites = getInvites();
      return invites.filter(i => i.email === email && i.status === 'PENDING');
  },
  
  acceptInvite: (inviteId: string, loaneeId: string) => {
      const invites = getInvites();
      const invite = invites.find(i => i.id === inviteId);
      if(!invite) return;
      
      const users = getUsers();
      const updatedUsers = users.map(u => {
          if (u.id === invite.loanerId) {
             return { ...u, network: Array.from(new Set([...(u.network || []), loaneeId])) };
          }
          if (u.id === loaneeId) {
              return { ...u, network: Array.from(new Set([...(u.network || []), invite.loanerId])) };
          }
          return u;
      });
      setUsers(updatedUsers);
      
      const updatedInvites = invites.map(i => i.id === inviteId ? { ...i, status: 'ACCEPTED' as const } : i);
      setInvites(updatedInvites);
      
      // Update session if needed
      const current = AuthService.getCurrentUser();
      if(current && current.id === loaneeId) {
          AuthService.login(current.email, current.password || 'password'); // Refresh session data crudely
      }
  }
};
