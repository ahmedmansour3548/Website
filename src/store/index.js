import { legacy_createStore as createStore, combineReducers } from 'redux';
import { animationReducer } from '../reducers/animationReducer';
import { patternReducer } from '../reducers/patternReducer';
import { cameraReducer } from '../reducers/cameraReducer';
import { timelineReducer } from '../reducers/timelineReducer';

const rootReducer = combineReducers({
    timeline: timelineReducer,
    animation: animationReducer,
    camera: cameraReducer,
    pattern: patternReducer,
});

export const store = createStore(rootReducer);
