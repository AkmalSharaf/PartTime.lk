// src/redux/reducers/profileReducer.js
const initialState = {
    profile: null,
    loading: false,
    error: null
  };
  
  export default function(state = initialState, action) {
    const { type, payload } = action;
    
    switch(type) {
      default:
        return state;
    }
  }