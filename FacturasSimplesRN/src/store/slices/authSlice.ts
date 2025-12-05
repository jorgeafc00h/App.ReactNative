// Auth slice for user authentication and session management

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, User } from '../../types';

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isGuestMode: false,
  loading: false,
  error: null,
  token: null,
  refreshToken: null,
  selectedCompanyId: null,
};

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      // TODO: Implement actual login API call
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.message || 'Login failed');
      }

      const data = await response.json();
      return {
        user: data.user,
        token: data.token,
        refreshToken: data.refreshToken,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (
    userData: { 
      email: string; 
      password: string; 
      firstName: string; 
      lastName: string; 
      phone?: string; 
    }, 
    { rejectWithValue }
  ) => {
    try {
      // TODO: Implement actual registration API call
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.message || 'Registration failed');
      }

      const data = await response.json();
      return {
        user: data.user,
        token: data.token,
        refreshToken: data.refreshToken,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState };
      const { refreshToken: token } = state.auth;

      if (!token) {
        return rejectWithValue('No refresh token available');
      }

      // TODO: Implement actual token refresh API call
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return rejectWithValue('Token refresh failed');
      }

      const data = await response.json();
      return {
        token: data.token,
        refreshToken: data.refreshToken,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (
    profileData: Partial<User>,
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as { auth: AuthState };
      const { token } = state.auth;

      // TODO: Implement actual profile update API call
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.message || 'Profile update failed');
      }

      const data = await response.json();
      return data.user;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { getState }) => {
    try {
      const state = getState() as { auth: AuthState };
      const { token } = state.auth;

      // TODO: Implement actual logout API call
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error);
    }
  }
);

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Clear error state
    clearError: (state) => {
      state.error = null;
    },
    
    // Set selected company
    setSelectedCompany: (state, action: PayloadAction<string | null>) => {
      state.selectedCompanyId = action.payload;
    },
    
    // Update user locally (for optimistic updates)
    updateUserLocal: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    
    // Reset auth state (for app reset)
    resetAuth: (state) => {
      Object.assign(state, initialState);
    },
    
    // Set loading state manually
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    // Restore session from storage
    restoreSession: (state, action: PayloadAction<{
      user: User;
      token: string;
      refreshToken: string;
      selectedCompanyId?: string;
    }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.selectedCompanyId = action.payload.selectedCompanyId || null;
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;
    },

    // Set authenticated user (for Google auth)
    setAuthenticatedUser: (state, action: PayloadAction<{
      user: User;
      accessToken: string;
      refreshToken?: string;
    }>) => {
      state.user = action.payload.user;
      state.token = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken || null;
      state.isAuthenticated = true;
      state.isGuestMode = false;
      state.loading = false;
      state.error = null;
    },
    
    // Set guest mode (continue without account)
    setGuestMode: (state, action: PayloadAction<boolean>) => {
      state.isGuestMode = action.payload;
      if (action.payload) {
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
      }
    },
  },
  extraReducers: (builder) => {
    // Login user
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // Register user
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // Refresh token
    builder
      .addCase(refreshToken.pending, (state) => {
        // Don't show loading for token refresh
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
      })
      .addCase(refreshToken.rejected, (state) => {
        // Token refresh failed - log out user
        Object.assign(state, initialState);
      });

    // Update profile
    builder
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Logout user
    builder
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        Object.assign(state, initialState);
      })
      .addCase(logoutUser.rejected, (state) => {
        // Even if logout API fails, clear local state
        Object.assign(state, initialState);
      });
  },
});

// Actions
export const {
  clearError,
  setSelectedCompany,
  updateUserLocal,
  resetAuth,
  setLoading,
  restoreSession,
  setAuthenticatedUser,
  setGuestMode,
} = authSlice.actions;

export default authSlice.reducer;