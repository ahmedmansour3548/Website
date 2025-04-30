import Gallery from "react-photo-gallery";
import { motion } from "framer-motion";

const ImageGrid = ({ photos }) => {
    const handleClick = (event, { photo }) => {
        if (photo.onClick) {
            photo.onClick();
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
        >
            <Gallery photos={photos} onClick={handleClick} />
        </motion.div>
    );
};

export default ImageGrid;
