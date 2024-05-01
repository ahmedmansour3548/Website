import { combineReducers } from 'redux';
import { animationReducer } from './animationReducer';
import { timelineReducer } from './timelineReducer';
import { cameraReducer } from './cameraReducer';
import { patternReducer } from './patternReducer';

const rootReducer = combineReducers({
    animation: animationReducer,
    timeline: timelineReducer,
    camera: cameraReducer,
    pattern: patternReducer
});

export default rootReducer;
