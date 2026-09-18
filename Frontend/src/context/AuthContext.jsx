import { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

// The backend signs sub (username), uid (user id), role and jti; see
// AuthController.GenerateJwtToken. The other names are the ones ASP.NET emits
// when the standard claim types are used, kept as fallbacks.
const userFromToken = (token) => {
  const payload = JSON.parse(atob(token.split('.')[1]));
  return {
    id: payload.uid || payload.nameid,
    username: payload.sub || payload.unique_name || payload.name,
    role: payload.role || payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
  };
};

// Read the stored token once, before the first render, so a signed-in user
// never sees the logged-out UI flash by.
const readStoredUser = () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    return userFromToken(token);
  } catch {
    console.error('Invalid token');
    try { localStorage.removeItem('token'); } catch { /* ignore */ }
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(readStoredUser);

  const login = (token) => {
    localStorage.setItem('token', token);
    setUser(userFromToken(token));
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  // `loading` is kept for consumers (ProtectedRoute); the token is now read
  // synchronously, so there is nothing to wait for.
  return (
    <AuthContext.Provider value={{ user, login, logout, loading: false }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
