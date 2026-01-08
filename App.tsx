import React, { useState, useEffect } from 'react';
import { User, Loan, UserRole, LoanStatus, Currency, Invite } from './types';
import { AuthService, LoanService, NetworkService } from './services/storage';
import { Button, Card, Input as CommonInput, Select, Badge, Modal, FileUpload } from './components/Common';
import { 
  LogOut, 
  Home, 
  Users, 
  Wallet, 
  Plus, 
  Bell, 
  User as UserIcon,
  CheckCircle,
  Clock,
  Menu,
  X,
  Eye,
  Loader2
} from 'lucide-react';
import { format, addDays, differenceInDays, parseISO } from 'date-fns';

// --- View Definitions ---
type View = 'DASHBOARD' | 'LOANS' | 'NETWORK' | 'PROFILE';

// --- Helper Functions ---
const formatCurrency = (amount: number, currency: Currency) => {
  const symbol = currency === Currency.NGN ? '₦' : '₵';
  return `${symbol}${amount.toLocaleString()}`;
};

const calculateInterest = (principal: number, rate: number, requestDate: string) => {
  if (!rate) return 0;
  const days = differenceInDays(new Date(), parseISO(requestDate));
  if (days <= 0) return 0;
  const dailyRate = rate / 100 / 365;
  return principal * dailyRate * days;
};

// --- Sub-Components (Views) ---

// 1. Authentication View
const AuthView: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: UserRole.LOANEE as UserRole,
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (isLogin) {
        const user = await AuthService.login(formData.email, formData.password);
        onLogin(user);
      } else {
        const user = await AuthService.register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          role: formData.role,
          currency: formData.role === UserRole.LOANEE ? Currency.NGN : undefined,
          isAcceptingLoans: formData.role === UserRole.LOANER ? true : undefined,
        });
        onLogin(user);
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Custom Input for the Auth Screen specific design
  const AuthInput = ({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) => (
    <div className="space-y-2">
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
        {label}
      </label>
      <input 
        className="w-full bg-[#1a1a1a] text-white rounded-lg px-4 py-3 border border-transparent focus:border-prizzys focus:ring-0 outline-none transition-colors placeholder-gray-600"
        {...props}
      />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-black text-white font-sans">
      
      {/* Header Logo */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-black text-white tracking-tighter mb-2">
          PRIZZYS<span className="text-prizzys">.</span>
        </h1>
        <p className="text-gray-500 text-lg">Private Loan Management</p>
      </div>

      {/* Auth Card */}
      <div className="w-full max-w-md bg-[#121212] rounded-2xl p-8 shadow-2xl border border-[#222]">
        <h2 className="text-2xl font-bold text-white mb-6">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <>
              <AuthInput 
                label="Full Name"
                placeholder="John Doe" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                required 
              />
              <AuthInput 
                label="Phone Number (Required)"
                placeholder="+234..." 
                value={formData.phone} 
                onChange={e => setFormData({...formData, phone: e.target.value})} 
                required 
              />
              
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                  I Want To
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, role: UserRole.LOANEE})}
                    className={`h-12 rounded-lg font-bold text-sm transition-all ${
                      formData.role === UserRole.LOANEE 
                        ? 'bg-[#1a1a1a] text-white border border-gray-600' // Visual choice: usually primary is selected, but design might imply toggle
                        : 'bg-[#1a1a1a] text-gray-500 border border-transparent hover:bg-[#222]'
                    } ${formData.role === UserRole.LOANEE ? '!bg-[#1a1a1a] !border-gray-500' : ''}`}
                    // Actually, let's match the image: Selected seems to be Orange or Dark depending on state. 
                    // Let's make "Selected" = Orange.
                  >
                    <div 
                        className={`h-full w-full flex items-center justify-center rounded-lg border-2 ${
                            formData.role === UserRole.LOANEE 
                            ? 'bg-[#1a1a1a] border-gray-500 text-white' 
                            : 'bg-[#1a1a1a] border-transparent text-gray-500'
                        }`}
                        onClick={(e) => { e.stopPropagation(); setFormData({...formData, role: UserRole.LOANEE})}}
                    >
                        Borrow
                    </div>
                  </button>

                  <div className="grid grid-cols-2 gap-4 col-span-2">
                       <button
                        type="button"
                        onClick={() => setFormData({...formData, role: UserRole.LOANEE})}
                        className={`h-12 rounded-lg font-bold text-sm transition-all flex items-center justify-center ${
                          formData.role === UserRole.LOANEE 
                            ? 'bg-prizzys text-white' 
                            : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#222]'
                        }`}
                      >
                        Borrow
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, role: UserRole.LOANER})}
                        className={`h-12 rounded-lg font-bold text-sm transition-all flex items-center justify-center ${
                          formData.role === UserRole.LOANER 
                            ? 'bg-prizzys text-white' 
                            : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#222]'
                        }`}
                      >
                        Lend
                      </button>
                  </div>
                </div>
              </div>
            </>
          )}
          
          <AuthInput 
            label="Email"
            type="email" 
            placeholder="name@example.com" 
            value={formData.email} 
            onChange={e => setFormData({...formData, email: e.target.value})} 
            required 
          />
          <AuthInput 
            label="Password"
            type="password" 
            placeholder="••••••••" 
            value={formData.password} 
            onChange={e => setFormData({...formData, password: e.target.value})} 
            required 
          />

          {error && <p className="text-red-500 text-sm text-center bg-red-900/20 p-2 rounded border border-red-900/50">{error}</p>}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-prizzys hover:bg-prizzys-hover text-white font-bold h-12 rounded-lg transition-all focus:ring-4 focus:ring-prizzys/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg mt-4"
          >
            {loading ? <Loader2 className="animate-spin" /> : (isLogin ? 'Sign In' : 'Join Prizzys')}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-gray-400 hover:text-white text-sm transition-colors"
          >
            {isLogin ? (
              <span>New here? <span className="text-gray-200 underline decoration-gray-500 underline-offset-4">Create account</span></span>
            ) : (
              <span>Already have an account? <span className="text-gray-200 underline decoration-gray-500 underline-offset-4">Sign In</span></span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// 2. Main App Layout
const Layout: React.FC<{ 
  user: User; 
  currentView: View; 
  onChangeView: (v: View) => void; 
  onLogout: () => void;
  children: React.ReactNode 
}> = ({ user, currentView, onChangeView, onLogout, children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const NavItem = ({ view, icon: Icon, label }: { view: View; icon: any; label: string }) => (
    <button
      onClick={() => {
        onChangeView(view);
        setIsMobileMenuOpen(false);
      }}
      className={`flex items-center space-x-3 w-full p-3 rounded-lg transition-colors ${
        currentView === view ? 'bg-prizzys text-white' : 'text-gray-400 hover:bg-dark-800 hover:text-white'
      }`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-dark-900 text-gray-100 flex flex-col md:flex-row">
      <div className="md:hidden flex justify-between items-center p-4 border-b border-dark-800 bg-dark-900 sticky top-0 z-40">
        <span className="font-bold text-xl text-prizzys">Prizzys</span>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white">
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      <aside className={`
        fixed inset-0 z-30 bg-dark-900 md:static md:w-64 border-r border-dark-800 p-6 flex flex-col
        transition-transform duration-300 md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="hidden md:block mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight">PRIZZYS<span className="text-prizzys">.</span></h1>
          <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">{user.role}</p>
        </div>

        <nav className="flex-1 space-y-2">
          <NavItem view="DASHBOARD" icon={Home} label="Dashboard" />
          <NavItem view="LOANS" icon={Wallet} label="My Loans" />
          <NavItem view="NETWORK" icon={Users} label="Network" />
          <NavItem view="PROFILE" icon={UserIcon} label="Profile" />
        </nav>

        <div className="pt-6 border-t border-dark-800">
           <div className="flex items-center mb-4 space-x-3 text-sm text-gray-400">
             <div className="w-8 h-8 rounded-full bg-dark-700 flex items-center justify-center text-white font-bold">
               {user.name.charAt(0)}
             </div>
             <div className="flex-1 min-w-0">
                <p className="truncate font-medium text-white">{user.name}</p>
                <p className="truncate text-xs">{user.email}</p>
             </div>
           </div>
          <button 
            onClick={onLogout}
            className="flex items-center space-x-3 w-full p-2 text-gray-400 hover:text-red-400 transition-colors"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

// 3. Components for specific flows

// --- Dashboard View ---
const Dashboard: React.FC<{ user: User, refresh: () => void }> = ({ user, refresh }) => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
        try {
            const data = await LoanService.getLoansForUser(user.id, user.role);
            if(mounted) setLoans(data);
        } finally {
            if(mounted) setLoading(false);
        }
    };
    fetch();
    return () => { mounted = false; };
  }, [user, refresh]);

  if(loading) return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;

  const activeLoans = loans.filter(l => l.status === LoanStatus.ACTIVE || l.status === LoanStatus.REPAYMENT_SUBMITTED);
  const pendingRequests = loans.filter(l => l.status === LoanStatus.REQUESTED);
  const pendingConfirmations = loans.filter(l => l.status === LoanStatus.APPROVED_PENDING_CONFIRMATION);

  const totalActive = activeLoans.reduce((acc, l) => acc + l.amount, 0);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 border-l-4 border-prizzys">
          <h3 className="text-gray-400 text-sm font-medium">Active Loans Value</h3>
          <p className="text-3xl font-bold text-white mt-2">
            {formatCurrency(totalActive, user.currency || Currency.NGN)}
          </p>
        </Card>
        <Card className="p-6">
          <h3 className="text-gray-400 text-sm font-medium">Active Loan Count</h3>
          <p className="text-3xl font-bold text-white mt-2">{activeLoans.length}</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-gray-400 text-sm font-medium">Pending Requests</h3>
          <p className="text-3xl font-bold text-white mt-2">{pendingRequests.length}</p>
        </Card>
      </div>

      {user.role === UserRole.LOANEE && (
        <div className="space-y-6">
            {pendingConfirmations.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-yellow-500 flex items-center gap-2">
                    <Bell size={20} /> Action Required: Confirm Receipt
                    </h3>
                    {pendingConfirmations.map(loan => (
                    <LoanCard key={loan.id} loan={loan} user={user} onUpdate={refresh} />
                    ))}
                </div>
            )}

            {pendingRequests.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-400 flex items-center gap-2">
                    <Clock size={20} /> Awaiting Approval
                    </h3>
                    {pendingRequests.map(loan => (
                    <LoanCard key={loan.id} loan={loan} user={user} onUpdate={refresh} />
                    ))}
                </div>
            )}
        </div>
      )}

       {user.role === UserRole.LOANER && pendingRequests.length > 0 && (
         <div className="space-y-4">
            <h3 className="text-lg font-semibold text-prizzys flex items-center gap-2">
               <Bell size={20} /> Pending Approvals
            </h3>
            {pendingRequests.map(loan => (
               <LoanCard key={loan.id} loan={loan} user={user} onUpdate={refresh} />
            ))}
         </div>
      )}
    </div>
  );
};

// --- Loans View & Loan Card Component ---
const LoanCard: React.FC<{ loan: Loan; user: User; onUpdate: () => void }> = ({ loan, user, onUpdate }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [actionType, setActionType] = useState<'APPROVE' | 'REPAY' | 'CLEAR' | 'CONFIRM_RECEIPT' | null>(null);
  const [proofImage, setProofImage] = useState('');
  const [interestRate, setInterestRate] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleAction = async () => {
    let updatedLoan = { ...loan };

    if (actionType === 'APPROVE') {
      if (!proofImage) return alert("Please upload proof of disbursement");
      updatedLoan.status = LoanStatus.APPROVED_PENDING_CONFIRMATION;
      updatedLoan.proofOfDisbursement = proofImage;
      updatedLoan.interestRate = interestRate;
      updatedLoan.approvalDate = new Date().toISOString();
    } 
    else if (actionType === 'CONFIRM_RECEIPT') {
       updatedLoan.status = LoanStatus.ACTIVE;
    }
    else if (actionType === 'REPAY') {
       updatedLoan.status = LoanStatus.REPAYMENT_SUBMITTED;
       updatedLoan.proofOfRepayment = proofImage;
    }
    else if (actionType === 'CLEAR') {
       updatedLoan.status = LoanStatus.CLEARED;
       updatedLoan.clearedDate = new Date().toISOString();
    }

    setLoading(true);
    try {
        await LoanService.updateLoan(updatedLoan);
        setModalOpen(false);
        onUpdate();
    } catch(e) {
        alert("Action failed. Please try again.");
    } finally {
        setLoading(false);
    }
  };

  const statusColors = {
    [LoanStatus.REQUESTED]: 'yellow',
    [LoanStatus.APPROVED_PENDING_CONFIRMATION]: 'blue',
    [LoanStatus.ACTIVE]: 'green',
    [LoanStatus.REPAYMENT_SUBMITTED]: 'blue',
    [LoanStatus.CLEARED]: 'gray',
    [LoanStatus.RESCINDED]: 'red',
    [LoanStatus.DEFAULTED]: 'red',
  };

  const statusText = {
      [LoanStatus.REQUESTED]: 'Requested',
      [LoanStatus.APPROVED_PENDING_CONFIRMATION]: 'Disbursement Sent - Waiting Confirmation',
      [LoanStatus.ACTIVE]: 'Active',
      [LoanStatus.REPAYMENT_SUBMITTED]: 'Repayment Review',
      [LoanStatus.CLEARED]: 'Cleared',
      [LoanStatus.RESCINDED]: 'Rescinded',
      [LoanStatus.DEFAULTED]: 'Defaulted',
  }

  return (
    <>
      <Card className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-white text-lg">
              {formatCurrency(loan.amount, loan.currency)}
            </span>
            <Badge color={statusColors[loan.status] as any}>{statusText[loan.status]}</Badge>
          </div>
          <p className="text-sm text-gray-400">
            {user.role === UserRole.LOANER ? `Borrower: ${loan.loaneeName}` : `Lender: ${loan.loanerName}`}
          </p>
          <div className="text-xs text-gray-500 mt-1 flex gap-4">
             <span>Due: {format(parseISO(loan.dueDate), 'MMM dd, yyyy')}</span>
             {loan.interestRate > 0 && <span>Interest: {loan.interestRate}% p.a.</span>}
          </div>
        </div>

        <div className="flex gap-2">
            {loan.proofOfDisbursement && (
                <Button size="sm" variant="secondary" onClick={() => {
                    const win = window.open();
                    win?.document.write(`<img src="${loan.proofOfDisbursement}" style="max-width:100%"/>`);
                }}>
                    <Eye size={16} className="mr-1"/> Proof
                </Button>
            )}

          {user.role === UserRole.LOANER && loan.status === LoanStatus.REQUESTED && (
            <Button size="sm" onClick={() => { setActionType('APPROVE'); setModalOpen(true); }}>Approve & Pay</Button>
          )}
          {user.role === UserRole.LOANER && (loan.status === LoanStatus.ACTIVE || loan.status === LoanStatus.REPAYMENT_SUBMITTED) && (
            <Button size="sm" onClick={() => { setActionType('CLEAR'); setModalOpen(true); }}>Clear Loan</Button>
          )}

          {user.role === UserRole.LOANEE && loan.status === LoanStatus.APPROVED_PENDING_CONFIRMATION && (
              <Button size="sm" variant="primary" onClick={() => { setActionType('CONFIRM_RECEIPT'); setModalOpen(true); }}>
                  <CheckCircle size={16} className="mr-1"/> Confirm Receipt
              </Button>
          )}
          {user.role === UserRole.LOANEE && loan.status === LoanStatus.ACTIVE && (
            <Button size="sm" onClick={() => { setActionType('REPAY'); setModalOpen(true); }}>Repay</Button>
          )}
        </div>
      </Card>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setModalOpen(false)} 
        title={
            actionType === 'APPROVE' ? 'Approve & Upload Proof' :
            actionType === 'REPAY' ? 'Submit Repayment' :
            actionType === 'CONFIRM_RECEIPT' ? 'Confirm Funds Received' :
            'Clear Loan'
        }
      >
        <div className="space-y-4">
          {actionType === 'APPROVE' && (
            <>
              <p className="text-sm text-gray-400">Set interest rate (0 for interest-free) and upload proof of transfer to the borrower.</p>
              <CommonInput 
                type="number" 
                label="Annual Interest Rate (%)" 
                value={interestRate} 
                onChange={(e) => setInterestRate(Number(e.target.value))}
              />
              <div className="p-3 bg-dark-900 rounded text-sm text-gray-300">
                  <p>Bank: {user.role === UserRole.LOANER ? "Check Borrower Profile" : "N/A"}</p>
              </div>
              <FileUpload label="Proof of Transfer (Screenshot)" onFileSelect={setProofImage} />
            </>
          )}

          {actionType === 'REPAY' && (
            <>
              <p className="text-sm text-gray-400">Upload repayment receipt (optional but recommended).</p>
               <div className="p-3 bg-dark-900 rounded text-sm text-gray-300">
                  Amount Due Now: {formatCurrency(loan.amount + calculateInterest(loan.amount, loan.interestRate, loan.requestDate), loan.currency)}
               </div>
              <FileUpload label="Repayment Receipt" onFileSelect={setProofImage} />
            </>
          )}

          {actionType === 'CONFIRM_RECEIPT' && (
              <div className="text-center space-y-4">
                  <div className="bg-dark-900 p-2 rounded">
                      <p className="text-sm text-gray-400 mb-2">Loaner's Proof:</p>
                      <img src={loan.proofOfDisbursement} alt="Proof" className="max-h-48 mx-auto rounded" />
                  </div>
                  <p className="text-sm text-white">Have you received <b>{formatCurrency(loan.amount, loan.currency)}</b> in your bank account?</p>
              </div>
          )}
          
          {actionType === 'CLEAR' && (
              <div className="space-y-2">
                  <p className="text-sm text-gray-400">Are you sure you want to mark this loan as fully repaid?</p>
                  {loan.proofOfRepayment && (
                      <div className="bg-dark-900 p-2 rounded">
                          <p className="text-xs text-gray-500 mb-1">Repayment Proof provided by Borrower:</p>
                          <img src={loan.proofOfRepayment} alt="Repayment Proof" className="max-h-40 mx-auto rounded" />
                      </div>
                  )}
              </div>
          )}

          <Button className="w-full" onClick={handleAction} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : (actionType === 'CONFIRM_RECEIPT' ? 'Yes, Funds Received' : 'Confirm')}
          </Button>
        </div>
      </Modal>
    </>
  );
};

const LoansView: React.FC<{ user: User }> = ({ user }) => {
    const [loans, setLoans] = useState<Loan[]>([]);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [loading, setLoading] = useState(true);
    const refresh = () => setRefreshTrigger(p => p + 1);

    useEffect(() => {
        let mounted = true;
        const fetch = async () => {
            try {
                const data = await LoanService.getLoansForUser(user.id, user.role);
                if(mounted) setLoans(data);
            } finally {
                if(mounted) setLoading(false);
            }
        };
        fetch();
        return () => { mounted = false };
    }, [user, refreshTrigger]);

    const [isRequestOpen, setRequestOpen] = useState(false);
    const [requestLoading, setRequestLoading] = useState(false);
    const [requestData, setRequestData] = useState({ amount: '', dueDate: '', loanerId: '' });
    
    const [myLoaners, setMyLoaners] = useState<User[]>([]);
    useEffect(() => {
        const fetchNetwork = async () => {
            if (user.role === UserRole.LOANEE) {
                const network = await NetworkService.getNetworkMembers(user.id);
                setMyLoaners(network.filter(u => u.isAcceptingLoans));
            }
        };
        fetchNetwork();
    }, [user]);

    const handleRequest = async () => {
        if (!requestData.loanerId || !requestData.amount || !requestData.dueDate) return;
        
        setRequestLoading(true);
        const selectedLoaner = myLoaners.find(l => l.id === requestData.loanerId);

        try {
            await LoanService.requestLoan({
                loaneeId: user.id,
                loaneeName: user.name,
                loanerId: requestData.loanerId,
                loanerName: selectedLoaner?.name || 'Unknown',
                amount: Number(requestData.amount),
                currency: user.currency || Currency.NGN,
                dueDate: requestData.dueDate,
                interestRate: 0,
            });
            setRequestOpen(false);
            refresh();
        } catch(e) {
            alert("Error requesting loan");
        } finally {
            setRequestLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">My Loans</h2>
                {user.role === UserRole.LOANEE && (
                    <Button onClick={() => setRequestOpen(true)} className="flex items-center gap-2">
                        <Plus size={18} /> Request Loan
                    </Button>
                )}
            </div>

            <div className="space-y-4">
                {loading && <p className="text-gray-500">Loading loans...</p>}
                {!loading && loans.length === 0 && <p className="text-gray-500 text-center py-8">No loans found.</p>}
                {!loading && loans.map(loan => <LoanCard key={loan.id} loan={loan} user={user} onUpdate={refresh} />)}
            </div>

            <Modal isOpen={isRequestOpen} onClose={() => setRequestOpen(false)} title="Request a Loan">
                <div className="space-y-4">
                    <Select 
                        label="Select Lender" 
                        value={requestData.loanerId}
                        onChange={e => setRequestData({...requestData, loanerId: e.target.value})}
                    >
                        <option value="">Select a Lender...</option>
                        {myLoaners.map(l => (
                            <option key={l.id} value={l.id}>{l.name}</option>
                        ))}
                    </Select>
                    {myLoaners.length === 0 && <p className="text-xs text-red-400">You need to be invited by a lender first.</p>}
                    
                    <CommonInput 
                        label={`Amount (${user.currency || 'NGN'})`}
                        type="number"
                        value={requestData.amount}
                        onChange={e => setRequestData({...requestData, amount: e.target.value})}
                    />
                    
                    <CommonInput 
                        label="Promised Repayment Date"
                        type="date"
                        min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                        value={requestData.dueDate}
                        onChange={e => setRequestData({...requestData, dueDate: e.target.value})}
                    />
                    
                    <Button className="w-full" onClick={handleRequest} disabled={!requestData.loanerId || requestLoading}>
                        {requestLoading ? <Loader2 className="animate-spin" /> : 'Submit Request'}
                    </Button>
                </div>
            </Modal>
        </div>
    );
};

// --- Network View ---
const NetworkView: React.FC<{ user: User }> = ({ user }) => {
    const [network, setNetwork] = useState<User[]>([]);
    const [inviteEmail, setInviteEmail] = useState('');
    const [myPendingInvites, setMyPendingInvites] = useState<Invite[]>([]);
    const [loading, setLoading] = useState(true);

    const refresh = async () => {
        setLoading(true);
        try {
            const members = await NetworkService.getNetworkMembers(user.id);
            setNetwork(members);
            
            if (user.role === UserRole.LOANEE) {
                const invites = await NetworkService.getPendingInvites(user.email);
                setMyPendingInvites(invites);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refresh();
    }, [user]);

    const handleInvite = async () => {
        try {
            await NetworkService.sendInvite(user.id, user.name, inviteEmail);
            alert("Invite sent!");
            setInviteEmail('');
            refresh();
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handleAccept = async (inviteId: string) => {
        try {
            await NetworkService.acceptInvite(inviteId, user.id);
            refresh();
            // Force reload to update user context in App if necessary, 
            // though Firestore listener in App should pick up user change if we updated the User doc.
            // Since acceptInvite updates the user doc, the App listener will fire.
        } catch(e) {
            alert("Error accepting invite");
        }
    };

    return (
        <div className="space-y-6">
             <h2 className="text-2xl font-bold text-white">
                {user.role === UserRole.LOANER ? 'My Borrowers' : 'My Lenders'}
             </h2>

            {user.role === UserRole.LOANER && (
                <Card className="p-4 mb-6">
                    <h3 className="text-lg font-medium text-white mb-4">Invite New Borrower</h3>
                    <div className="flex gap-2">
                        <CommonInput 
                            placeholder="Borrower Email Address" 
                            value={inviteEmail}
                            onChange={e => setInviteEmail(e.target.value)}
                        />
                        <Button onClick={handleInvite}>Send Invite</Button>
                    </div>
                </Card>
            )}

            {user.role === UserRole.LOANEE && myPendingInvites.length > 0 && (
                <Card className="p-4 mb-6 border-prizzys">
                    <h3 className="text-lg font-medium text-prizzys mb-2">Pending Invites</h3>
                    <div className="space-y-2">
                        {myPendingInvites.map(invite => (
                            <div key={invite.id} className="flex justify-between items-center bg-dark-900 p-3 rounded">
                                <span><b>{invite.loanerName}</b> invited you to their network.</span>
                                <Button size="sm" onClick={() => handleAccept(invite.id)}>Accept</Button>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            <div className="grid gap-4">
                {loading && <p className="text-gray-500">Loading network...</p>}
                {!loading && network.length === 0 && <p className="text-gray-500">Your network is empty.</p>}
                {!loading && network.map(member => (
                    <Card key={member.id} className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-dark-700 flex items-center justify-center text-white font-bold">
                                {member.name.charAt(0)}
                            </div>
                            <div>
                                <h4 className="font-medium text-white">{member.name}</h4>
                                <p className="text-sm text-gray-500">{member.email}</p>
                                <p className="text-xs text-gray-600">{member.phone}</p>
                            </div>
                        </div>
                        {user.role === UserRole.LOANER && (
                            <div className="text-right">
                                <Badge color="green">Active</Badge>
                            </div>
                        )}
                        {user.role === UserRole.LOANEE && member.isAcceptingLoans && (
                             <Badge color="green">Lending</Badge>
                        )}
                        {user.role === UserRole.LOANEE && !member.isAcceptingLoans && (
                             <Badge color="yellow">Paused</Badge>
                        )}
                    </Card>
                ))}
            </div>
        </div>
    );
};

// --- Profile View ---
const ProfileView: React.FC<{ user: User }> = ({ user }) => {
    return (
        <div className="space-y-6 max-w-2xl">
             <h2 className="text-2xl font-bold text-white">Profile</h2>
             <Card className="p-6 space-y-6">
                 <div className="flex items-center space-x-4 mb-6">
                    <div className="w-20 h-20 bg-prizzys rounded-full flex items-center justify-center text-4xl font-bold text-white">
                        {user.name.charAt(0)}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">{user.name}</h3>
                        <Badge color="blue">{user.role}</Badge>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                         <label className="text-xs text-gray-500 uppercase">Email</label>
                         <p className="text-white">{user.email}</p>
                     </div>
                     <div>
                         <label className="text-xs text-gray-500 uppercase">Phone</label>
                         <p className="text-white">{user.phone}</p>
                     </div>
                     <div>
                         <label className="text-xs text-gray-500 uppercase">Member Since</label>
                         <p className="text-white">{format(parseISO(user.createdAt), 'MMMM dd, yyyy')}</p>
                     </div>
                 </div>

                 {user.role === UserRole.LOANEE && user.bankAccount && (
                     <div className="pt-4 border-t border-dark-700">
                         <h4 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                             <Wallet size={18} /> Bank Details
                         </h4>
                         <div className="bg-dark-900 p-4 rounded-lg space-y-2">
                             <div className="flex justify-between">
                                 <span className="text-gray-500">Bank Name</span>
                                 <span className="text-white">{user.bankAccount.bankName}</span>
                             </div>
                             <div className="flex justify-between">
                                 <span className="text-gray-500">Account Name</span>
                                 <span className="text-white">{user.bankAccount.accountName}</span>
                             </div>
                             <div className="flex justify-between">
                                 <span className="text-gray-500">Account Number</span>
                                 <span className="text-white font-mono">{user.bankAccount.accountNumber}</span>
                             </div>
                         </div>
                     </div>
                 )}

                 {user.role === UserRole.LOANER && (
                      <div className="pt-4 border-t border-dark-700">
                           <h4 className="text-lg font-medium text-white mb-3">Lending Status</h4>
                           <div className="flex items-center justify-between bg-dark-900 p-4 rounded-lg">
                               <span className="text-gray-400">Status</span>
                               <Badge color={user.isAcceptingLoans ? 'green' : 'red'}>
                                   {user.isAcceptingLoans ? 'Accepting Requests' : 'Paused'}
                               </Badge>
                           </div>
                           <p className="text-xs text-gray-500 mt-2">
                               When paused, your borrowers will see that you are currently not accepting new loan requests.
                           </p>
                      </div>
                 )}
             </Card>
        </div>
    );
};

// --- Main App Component ---

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>('DASHBOARD');
  // Simple hack to trigger refreshes across components
  const [, setRefreshKey] = useState(0); 

  useEffect(() => {
    // Subscribe to Firebase Auth changes
    const unsubscribe = AuthService.subscribe((u) => {
        setUser(u);
        setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = () => {
    // Note: The auth subscriber will actually handle the state update
    // But we can set view to dashboard
    setCurrentView('DASHBOARD');
  };

  const handleLogout = async () => {
    await AuthService.logout();
    setUser(null);
  };

  const forceRefresh = () => setRefreshKey(k => k + 1);

  if (authLoading) {
      return (
          <div className="min-h-screen bg-black flex items-center justify-center text-white">
              <Loader2 className="animate-spin text-prizzys" size={48} />
          </div>
      );
  }

  if (!user) {
    return <AuthView onLogin={handleLogin} />;
  }

  return (
    <Layout user={user} currentView={currentView} onChangeView={setCurrentView} onLogout={handleLogout}>
      {currentView === 'DASHBOARD' && <Dashboard user={user} refresh={forceRefresh} />}
      {currentView === 'LOANS' && <LoansView user={user} />}
      {currentView === 'NETWORK' && <NetworkView user={user} />}
      {currentView === 'PROFILE' && <ProfileView user={user} />}
    </Layout>
  );
};

export default App;