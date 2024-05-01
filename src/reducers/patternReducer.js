// reducers/patternReducer.js
import { SET_PATTERN_PARAMS } from '../actions/patternActions';

const initialState = {
    params: null, // Initial state for pattern parameters
};

export const patternReducer = (state = initialState, action) => {
    switch (action.type) {
        case SET_PATTERN_PARAMS:
            console.log("setting!");
            return { ...state, params: action.payload };
        default:
            return state;
    }
};


