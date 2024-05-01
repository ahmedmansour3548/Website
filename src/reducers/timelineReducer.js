import { gsap } from 'gsap';
import {
    CREATE_TIMELINE,
    PLAY_TIMELINE,
    PAUSE_TIMELINE,
    REVERSE_TIMELINE,
    SEEK_TIMELINE,
    ANIMATE_PATTERN,
    ROTATE_PATTERN,
    CLICKED_PATTERN,
    START_PATTERN_ANIMATION,
    STOP_PATTERN_ANIMATION
} from '../actions/timelineActions';

const initialState = {
    timeline: gsap.timeline({ paused: true }), // Initially paused
    animationParams: {},
    isPatternAnimating: false
};

export const timelineReducer = (state = initialState, action) => {
    switch (action.type) {
        case CREATE_TIMELINE:
            return { ...state, timeline: action.payload };
        case PLAY_TIMELINE:
            state.timeline.play();
            return state;
        case PAUSE_TIMELINE:
            state.timeline.pause();
            return state;
        case REVERSE_TIMELINE:
            state.timeline.reverse();
            return state;
        case SEEK_TIMELINE:
            state.timeline.seek(action.payload);
            return state;
        case ANIMATE_PATTERN: {
            console.log("animating!");
            // Update state with new animation params
            return { ...state, animationParams: { ...state.animationParams, ...action.payload } };
        }
        case ROTATE_PATTERN:
            // Append the rotatePattern segment to the timeline
            state.timeline.to(/* animation parameters based on action.payload */);
            return { ...state };
        case CLICKED_PATTERN:
            // Append the clickedPattern segment to the timeline
            state.timeline.to(/* animation parameters */);
            return { ...state };
        case START_PATTERN_ANIMATION:
            return { ...state, isPatternAnimating: true };
        case STOP_PATTERN_ANIMATION:
            return { ...state, isPatternAnimating: false };
        default:
            return state;
    }
};
