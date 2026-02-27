// src/redux/reducers/jobReducer.js
const initialState = {
    jobs: [],
    job: null,
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