// Blobby Image Viewer.
// A quick test for the blobby image renderer.
// By Cliff Earl, Antix Development, 2024 (https://github.com/Antix-Development).
// MIT licence.

let blobbyImages=[[['0i262a0k5g0k6O2U3U3W6M5o5c7m2q7o0i5M',1,7],'6S7D',],[['0g23280h5e0h6+21707h5m613w7j225X0i7h',1,3],['2u1l3O1B3Q412A3R',1,0],['4G1p5+1F60454M3V',1,0],'7e7r',],[['0g23280h5e0h6+21707h5m613w7j225X0i7h',1,2],['4G1p5+1F603/4M3V',1,0],['2u1l3O1B3Q412A3R',1,0],'7e7r',],[['0g23280h5e0h6+21707h5m613w7j225X0i7h',1,4],['4M1p641F66454S3V',1,0],['2u1l3O1B3Q412A3R',1,0],'7e7r',],[['0g23280h5e0h6+21707h5m613w7j225X0i7h',1,5],['2u1l3O1B3Q412A3R',1,0],['4G1p5+1F60454M3V',1,0],'7e7r',],[['0g23280h5e0h6+21707h5m613w7j225X0i7h',1,6],['2A1z3Q1n3O3P2u43',1,2],['4M1D601r5+3T4G47',1,2],'7e7r',],[['0z0z7n0z7n7n0z7n',0.6,6],'7V7V',],[['0h1u2P025r1k5t4i335A0v4m',1,7],'5O5B',],[['171Q2n2O1F40033c',1,2],['3g1D4S2r3O3P2y2R',1,2],['1H142x022p103d2a2f1O1v2m',1,1],'4U42',],[['1y13303T1o53023F',1,1],['0M0h1E051w1d',0.8,7],'3154',],[['1a102m1m3U0+502k3A4C1q4C022A',1,2],['1U042E0w2m1k',0.8,1],'524V',],[['2+2r4m5H2E5N',1,5],['0c1F3o036e25543L123R',1,0],['1S132w1H2a2n1i21',1,2],['4z205r2m4T3k4d2I',1,2],'6k6a',],4,['fff','aaa','444','8f8','7b7','474','fcc','f55','a22','eef','aaf','44a','fcf','f0f','707','fa0','b60','730','66f','33c','116','ff0','aa0','440']];

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

  svgString = `<svg viewBox="0 0 ${imageWidth} ${imageHeight}" width="${imageWidth}" height="${imageHeight}" xmlns="http://www.w3.org/2000/svg"><defs>`,

  pathsString = '',

  svgColorStop = (offset, color) => svgString += `<stop offset="${offset}" stop-color="#${color}"/>`,

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
    svgString += `<radialGradient id="g${gradientID}" r="90%" cx="30%" cy="30%">`;
    svgColorStop(0, palettes[paletteIndex ++]);
    svgColorStop(.2, palettes[paletteIndex ++]);
    svgColorStop(.6, palettes[paletteIndex ++]);
    svgString += `</radialGradient>`;

    // Append component path.
    pathsString += `<path d="${path}" stroke="#000" stroke-width="${blobbyImages[blobbyImagesSize - 2]}" fill="url(#g${gradientID++})"/>`;
  }

  // Execute this code when the image has fully loaded.
  img.onload = () => {
    // Do whatever with the image now.
    imageContainer.appendChild(img); // Example displays it in an HTML div.
  }

  img.src = `data:image/svg+xml;base64,${btoa(svgString + '</defs>' + pathsString + `</svg>`)}`; // Mime encode SVG and set it to the images source (start it loading).
};

// Execute this code when the page has fully loaded.
onload = e => {
  for (let i = 0; i < blobbyImages.length - 2; i++) renderBlobbyImage(i);
};
