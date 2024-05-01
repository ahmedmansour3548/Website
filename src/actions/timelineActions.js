// Action Types

// Timeline control
export const CREATE_TIMELINE = 'CREATE_TIMELINE';
export const PLAY_TIMELINE = 'PLAY_TIMELINE';
export const PAUSE_TIMELINE = 'PAUSE_TIMELINE';
export const REVERSE_TIMELINE = 'REVERSE_TIMELINE';
export const SEEK_TIMELINE = 'SEEK_TIMELINE';

// Pattern control
export const ANIMATE_PATTERN = 'ANIMATE_PATTERN';
export const ROTATE_PATTERN = 'ROTATE_PATTERN';
export const CLICKED_PATTERN = 'CLICKED_PATTERN';

export const START_PATTERN_ANIMATION = 'START_PATTERN_ANIMATION';
export const STOP_PATTERN_ANIMATION = 'STOP_PATTERN_ANIMATION';

// Action Creators
export const createTimeline = (timeline) => ({
    type: CREATE_TIMELINE,
    payload: timeline
});

export const playTimeline = () => ({
    type: PLAY_TIMELINE
});

export const pauseTimeline = () => ({
    type: PAUSE_TIMELINE
});

export const reverseTimeline = () => ({
    type: REVERSE_TIMELINE
});

export const seekTimeline = (time) => ({
    type: SEEK_TIMELINE,
    payload: time
});

export const animatePattern = (animationParams) => ({
    type: ANIMATE_PATTERN,
    payload: animationParams
});

export const rotatePattern = (rotationAnimation) => ({
    type: ROTATE_PATTERN,
    payload: rotationAnimation
});

export const clickedPattern = () => ({
    type: CLICKED_PATTERN
});

export const startPatternAnimation = () => ({
    type: START_PATTERN_ANIMATION,
});

export const stopPatternAnimation = () => ({
    type: STOP_PATTERN_ANIMATION,
});