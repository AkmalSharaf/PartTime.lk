// src/redux/actions/authActions.js
import { LOGIN_SUCCESS, REGISTER_SUCCESS, LOGOUT } from './types';

// Login success action
export const loginSuccess = (user) => {
  return {
    type: LOGIN_SUCCESS,
    payload: user
  };
};

// Register success action
export const registerSuccess = (user) => {
  return {
    type: REGISTER_SUCCESS,
    payload: user
  };
};

// Logout action
export const logout = () => {
  return {
    type: LOGOUT
  };
};