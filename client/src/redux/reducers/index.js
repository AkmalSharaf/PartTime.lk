// src/redux/reducers/index.js
import { combineReducers } from 'redux';
import authReducer from './authReducer';
import profileReducer from './profileReducer';
import jobReducer from './jobReducer';
import applicationReducer from './applicationReducer';
import alertReducer from './alertReducer';

export default combineReducers({
  auth: authReducer,
  profile: profileReducer,
  job: jobReducer,
  application: applicationReducer,
  alert: alertReducer
});