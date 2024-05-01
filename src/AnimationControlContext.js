import React, { createContext, useContext, useState } from 'react';

const AnimationControlContext = createContext();

export const useAnimationControl = () => useContext(AnimationControlContext);

export const AnimationControlProvider = ({ children }) => {
    const [repeatRotation, setRepeatRotation] = useState(true);

    const toggleRepeatRotation = () => setRepeatRotation(!repeatRotation);

    return (
        <AnimationControlContext.Provider value={{ repeatRotation, toggleRepeatRotation }}>
            {children}
        </AnimationControlContext.Provider>
    );
};
