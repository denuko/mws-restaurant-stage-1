/**
 * helper.js contains functions that help not repeat code
 * in order to keep the code in other js files tidied up
 */

/**
 * Create source element and append it to picture element.
 */
addImageSourceToPicture = (picture, media, srcset) => {
    const source = document.createElement('source');
    source.media = media;
    source.srcset = srcset;
    picture.append(source);
};

/**
 * Extract extension from filename.
 */
fileExtension = (filename) => {
    return filename.split('.').pop();
};

/**
 * Get filename without extension.
 */
filenameWithoutExtension = (filename) => {
    return filename.replace(/.[^.]+$/, '');
};

/**
 * Get all possible names of an image depending on its size (small, medium, large).
 */
imageNamesBySize = (imageFilename) => {
    const imageΕxtension = fileExtension(imageFilename);
    const imageΝame = filenameWithoutExtension(imageFilename);
    const filenames = {};
    filenames.small = `${imageΝame}-small.${imageΕxtension}`;
    filenames.medium = `${imageΝame}-medium.${imageΕxtension}`;
    filenames.large = `${imageΝame}-large.${imageΕxtension}`;

    return filenames;
};