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
    const imageΕxtension = fileExtension(imageFilename);
    const image�?ame = filenameWithoutExtension(imageFilename);
    const filenames = {};
    filenames.small = `${image�?ame}-small.${imageΕxtension}`;
    filenames.medium = `${image�?ame}-medium.${imageΕxtension}`;
    filenames.large = `${image�?ame}-large.${imageΕxtension}`;

    return filenames;
};