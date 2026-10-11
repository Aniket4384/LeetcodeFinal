import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  problems: []
};

const problemSlice = createSlice({
  name: "problem",

  initialState,

  reducers: {
    setProblems: (state, action) => {
      state.problems = action.payload;
    },

   
    addProblem: (state, action) => {
      state.problems.push(action.payload);
    },

  
    updateProblem: (state, action) => {
      const index = state.problems.findIndex(
        (problem) => problem._id === action.payload._id
      );

      if (index !== -1) {
        state.problems[index] = action.payload;
      }
    },

    deleteProblem: (state, action) => {
      state.problems = state.problems.filter(
        (problem) => problem._id !== action.payload
      );
    }
  }
});

export const {
  setProblems,
  addProblem,
  updateProblem,
  deleteProblem
} = problemSlice.actions;

export default problemSlice.reducer;