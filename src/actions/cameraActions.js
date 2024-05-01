// Action Types
export const SET_CAMERA_POSITION = 'SET_CAMERA_POSITION';

// Action Creators
export const setCameraPosition = (position) => ({
    type: SET_CAMERA_POSITION,
    payload: position
});
