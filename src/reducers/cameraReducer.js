import { SET_CAMERA_POSITION } from '../actions/cameraActions';

const initialState = {
    position: { x: -340, y: 0, z: 500 } // Default camera position
};

export const cameraReducer = (state = initialState, action) => {
    switch (action.type) {
        case SET_CAMERA_POSITION:
            return {
                ...state,
                position: action.payload
            };
        default:
            return state;
    }
};
