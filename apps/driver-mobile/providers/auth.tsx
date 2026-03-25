import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import auth, { type FirebaseAuthTypes } from "@react-native-firebase/auth";

type AuthContextValue = {
  user: FirebaseAuthTypes.User | null;
  initializing: boolean;
  pendingPhoneNumber: string | null;
  sendOtp: (phoneNumber: string) => Promise<void>;
  confirmOtp: (code: string) => Promise<void>;
  resendOtp: () => Promise<void>;
  signOutUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function normalizeIndianPhone(phoneNumber: string) {
  const digits = phoneNumber.replace(/\D/g, "");

  if (digits.startsWith("91") && digits.length === 12) {
    return `+${digits}`;
  }

  if (digits.length === 10) {
    return `+91${digits}`;
  }

  if (phoneNumber.startsWith("+")) {
    return phoneNumber;
  }

  return `+${digits}`;
}

export function AuthProvider(props: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [confirmation, setConfirmation] = useState<FirebaseAuthTypes.ConfirmationResult | null>(null);
  const [pendingPhoneNumber, setPendingPhoneNumber] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((nextUser) => {
      setUser(nextUser);
      setInitializing(false);
      if (nextUser) {
        setConfirmation(null);
        setPendingPhoneNumber(null);
      }
    });

    return unsubscribe;
  }, []);

  async function sendOtp(phoneNumber: string) {
    const normalizedPhone = normalizeIndianPhone(phoneNumber);
    const result = await auth().signInWithPhoneNumber(normalizedPhone);
    setConfirmation(result);
    setPendingPhoneNumber(normalizedPhone);
  }

  async function confirmOtp(code: string) {
    if (!confirmation) {
      throw new Error("Request an OTP first.");
    }

    await confirmation.confirm(code.trim());
  }

  async function resendOtp() {
    if (!pendingPhoneNumber) {
      throw new Error("Enter a phone number first.");
    }

    await sendOtp(pendingPhoneNumber);
  }

  async function signOutUser() {
    await auth().signOut();
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        initializing,
        pendingPhoneNumber,
        sendOtp,
        confirmOtp,
        resendOtp,
        signOutUser
      }}
    >
      {props.children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
