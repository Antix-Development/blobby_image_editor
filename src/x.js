
let 
gradientID = 0, // every gradient must be unique.

// Render the blobby image at the given index.
renderBlobbyImage = index => {

  let 
  // Get the size (length) of the given array.
  sizeOf = array => (array.length),

  // Decode the given encoded ASCII into an array numbers.
  decodeCoordinates = encoded => {
    let 
    charset = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/',
    coords = [];
    for (let i = 0; i < sizeOf(encoded); i += 2) coords.push(charset.indexOf(encoded[i]) * 64 + charset.indexOf(encoded[i + 1]));
    return coords;
  },

  image = blobbyImages[index],

  imageToRenderSize = sizeOf(image),

  blobbyImagesSize = sizeOf(blobbyImages),

  palettes = blobbyImages[blobbyImagesSize - 1],

  [imageWidth, imageHeight] = decodeCoordinates(image[imageToRenderSize - 1]),

  svgString = `0 ${imageWidth} ${imageHeight}" width="${imageWidth}" height="${imageHeight}" xmlns="http://www.w3.org/2000/svg">`,

  pathsString = '',

  svgColorStop = (offset, color) => svgString += `"${offset}" stop-color="#${color}"/>`,

  img = new Image();

  // Render components loop.
  for (let j = 0; j < imageToRenderSize - 1; j++) {
    let 
    component = image[j],

    blobbiness = component[1],
    paletteIndex = component[2] * 3, // 3 color strings per palette.

    points = decodeCoordinates(component[0]);

    // Some points need to be duplicated.
    for (let k = 0; k < 6; k++) points.push(points[k]);

    let 
    pointsSize = sizeOf(points),

    path = 'M' + [points[2],  points[3]]; // Begin path.

    for (let i = 2; i < pointsSize; i += 2) {
      let 
      x1 = points[i],
      y1 = points[i + 1],

      x2 = points[i + 2],
      y2 = points[i + 3];

      path += 'C' + [x1 + ((x2 - (i ? points[i - 2] : points[0])) / 6) * blobbiness, 
        y1 + ((y2 - (i ? points[i - 1] : points[1])) / 6) * blobbiness, 
        x2 - (((i !== pointsSize ? points[i + 4] : x2) - x1) / 6) * blobbiness, 
        y2 - (((i !== pointsSize ? points[i + 5] : y2) - y1) / 6) * blobbiness, 
        x2, y2]; // Extend path.
    }

    // Append component gradient.
    svgString += `"g${gradientID}" r="90%" cx="30%" cy="30%">`;
    svgColorStop(0, palettes[paletteIndex ++]);
    svgColorStop(.2, palettes[paletteIndex ++]);
    svgColorStop(.6, palettes[paletteIndex ++]);
    svgString += ``;

    // Append component path.
    pathsString += `"${path}" stroke="#000" stroke-width="${blobbyImages[blobbyImagesSize - 2]}" fill="url(#g${gradientID++})"/>`;
  }

  // Execute this code when the image has fully loaded.
  img.onload = () => {
    // Do whatever with the image now.
    imageContainer.appendChild(img); // Example displays it in an HTML 
.
  }

  img.src = `data:image/svg+xml;base64,${btoa(svgString + '' + pathsString + ``)}`; // Mime encode SVG and set it to the images source (start it loading).
};

// Execute this code when the page has fully loaded.
onload = e => {
  for (let i = 0; i < blobbyImages.length - 2; i++) renderBlobbyImage(i);
};
