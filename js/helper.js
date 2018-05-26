/**
 * helper.js contains functions that help not repeat code
 * in order to keep the code in other js files tidied up
 */

/**
 * Create source element and append it to picture element.
 */
const addImageSourceToPicture = (picture, media, srcset) => {
    const source = document.createElement('source');
    source.media = media;
    source.srcset = srcset;
    picture.append(source);
};

/**
 * Extract extension from filename.
 */
const fileExtension = (filename) => {
    return filename.split('.').pop();
};

/**
 * Get filename without extension.
 */
const filenameWithoutExtension = (filename) => {
    return filename.replace(/.[^.]+$/, '');
};

/**
 * Get all possible names of an image depending on its size (small, medium, large).
 */
const imageNamesBySize = (imageFilename) => {
    const imageÎ•xtension = fileExtension(imageFilename);
    const imageÎ?ame = filenameWithoutExtension(imageFilename);
    const filenames = {};
    filenames.small = `${imageÎ?ame}-small.${imageÎ•xtension}`;
    filenames.medium = `${imageÎ?ame}-medium.${imageÎ•xtension}`;
    filenames.large = `${imageÎ?ame}-large.${imageÎ•xtension}`;

    return filenames;
};