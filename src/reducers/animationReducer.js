const initialState = {
    speed: 0.1 // Default animation speed
};

export const animationReducer = (state = initialState, action) => {
    switch (action.type) {
        case 'SET_ANIMATION_SPEED':
            return {
                ...state,
                speed: action.payload
            };
        default:
            return state;
    }
};
