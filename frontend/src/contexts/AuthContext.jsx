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

  // Fetch user role from database
  async function fetchUserRole(uid) {
    try {
      const response = await fetch(`http://localhost:8080/api/users/${uid}/role`)
      if (response.ok) {
        const data = await response.json()
        return data.role // 'donor', 'hospital', or 'patient'
      }
      return null
    } catch (error) {
      console.error('Error fetching user role:', error)
      return null
    }
  }

  function signup(email, password, name, role = 'donor') {
    return createUserWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        // Update display name
        await updateProfile(userCredential.user, { displayName: name })

        // Sync with backend
        try {
          const user = userCredential.user;
          const token = await user.getIdToken();

          const response = await fetch('http://localhost:8080/api/users/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              firebaseUid: user.uid,
              email: user.email,
              role: role.toUpperCase()
            })
          });

          if (!response.ok) {
            throw new Error(`User sync failed: ${response.status}`);
          }
        } catch (error) {
          console.error("Backend sync failed", error);
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
    // Clear any cached data
    setCurrentUser(null)
    return signOut(auth)
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Fetch role from database
        const role = await fetchUserRole(user.uid)

        // Set current user with role from database
        setCurrentUser({
          ...user,
          role: role, // Role from database
          uid: user.uid,
          email: user.email,
          name: user.displayName
        })
      } else {
        setCurrentUser(null)
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
