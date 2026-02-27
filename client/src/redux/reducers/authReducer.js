// src/redux/reducers/authReducer.js
import { LOGIN_SUCCESS, REGISTER_SUCCESS, LOGOUT } from '../actions/types';

const initialState = {
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null,
  loading: false
};

const authReducer = (state = initialState, action) => {
  switch (action.type) {
    case LOGIN_SUCCESS:
    case REGISTER_SUCCESS:
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload,
        loading: false
      };
    case LOGOUT:
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return {
        ...state,
        token: null,
        isAuthenticated: false,
        user: null
      };
    default:
      return state;
  }
};

export default authReducer;