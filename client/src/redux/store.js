// src/redux/store.js
import { createStore, applyMiddleware, combineReducers } from 'redux';
import { thunk } from 'redux-thunk'; // Fixed import syntax
import authReducer from './reducers/authReducer';

// Combine all reducers
const rootReducer = combineReducers({
  auth: authReducer
});

// Create store with middleware
const store = createStore(
  rootReducer,
  applyMiddleware(thunk)
);

export default store;