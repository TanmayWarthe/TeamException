import { createContext, useContext, useState, useEffect } from 'react'
import { auth } from '../firebase'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  function signup(email, password, name, role = 'donor') {
    return createUserWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        // Update display name
        await updateProfile(userCredential.user, { displayName: name })

        // Sync with backend
        try {
          const user = userCredential.user;
          const token = await user.getIdToken();
          localStorage.setItem('authToken', token);

          // We import apiService dynamically or assume it handles the header if we set it in localStorage
          // But here we need to make a call. We'll use fetch for simplicity to avoid circular dep if apiService imports AuthContext
          await fetch('http://localhost:8080/api/users/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // 'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({
              firebaseUid: user.uid,
              email: user.email,
              role: role.toUpperCase()
            })
          });
        } catch (error) {
          console.error("Backend sync failed", error);
          // Verify if we should throw or just log
        }

        return userCredential;
      })
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
  }

  function googleLogin() {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  }

  function logout() {
    return signOut(auth)
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      if (user) {
        // Optional: Get token for backend calls
        user.getIdToken().then(token => {
          localStorage.setItem('authToken', token)
        })
      } else {
        localStorage.removeItem('authToken')
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value = {
    currentUser,
    signup,
    login,
    googleLogin,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
