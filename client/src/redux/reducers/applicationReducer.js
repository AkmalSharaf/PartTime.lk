// src/redux/reducers/applicationReducer.js
const initialState = {
    applications: [],
    application: null,
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