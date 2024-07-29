// Blobby Image Viewer.
// A quick test for the blobby image renderer.
// By Cliff Earl, Antix Development, 2024 (https://github.com/Antix-Development).
// MIT licence.

let blobbyImages=[[[18,134,138,20,336,20,434,184,248,250,432,344,332,470,154,472,18,368,101,155,406,1,7],438,487],[[16,131,136,17,334,17,446,129,448,465,342,385,224,467,130,379,18,465,102,152,405,1,3],[158,85,242,101,244,257,164,245,175,136,154,1,0],[298,89,382,105,384,261,304,249,315,140,154,1,0],462,475],[[16,131,136,17,334,17,446,129,448,465,342,385,224,467,130,379,18,465,102,152,405,1,2],[298,89,382,105,384,255,304,249,315,138,149,1,0],[158,85,242,101,244,257,164,245,175,136,154,1,0],462,475],[[16,131,136,17,334,17,446,129,448,465,342,385,224,467,130,379,18,465,102,152,405,1,4],[304,89,388,105,390,261,310,249,321,140,154,1,0],[158,85,242,101,244,257,164,245,175,136,154,1,0],462,475],[[16,131,136,17,334,17,446,129,448,465,342,385,224,467,130,379,18,465,102,152,405,1,5],[158,85,242,101,244,257,164,245,175,136,154,1,0],[298,89,382,105,384,261,304,249,315,140,154,1,0],462,475],[[16,131,136,17,334,17,446,129,448,465,342,385,224,467,130,379,18,465,102,152,405,1,6],[164,99,244,87,242,243,158,259,175,138,154,1,2],[304,103,384,91,382,247,298,263,315,142,154,1,2],462,475],[[35,35,471,35,471,471,35,471,122,165,392,0.6,6],505,505],[[17,94,179,2,347,84,349,274,195,356,31,278,83,108,318,1,7],370,357],[[71,116,151,178,105,256,3,204,47,144,133,1,2],[208,103,310,155,242,243,162,181,206,131,133,1,2],[107,68,161,2,153,64,205,138,143,114,95,150,117,46,133,1,1],312,258],[[98,67,192,247,88,323,2,233,40,143,230,1,1],[48,17,104,5,96,77,59,26,64,0.8,7],193,324],[[74,62,150,84,248,60,320,146,228,292,90,292,2,162,97,106,286,1,2],[120,2,168,30,150,82,129,26,72,0.2,1],322,311],[[190,155,278,363,168,369,190,219,192,1,5],[12,105,216,3,398,133,324,239,66,245,127,51,347,1,0],[118,67,160,107,138,151,82,129,97,92,75,1,2],[291,128,347,150,311,212,269,172,284,153,75,1,2],404,394],4,['fff','aaa','444','8f8','7b7','474','fcc','f55','a22','eef','aaf','44a','fcf','f0f','707','fa0','b60','730','66f','33c','116','ff0','aa0','440']];

// Render the blobby image at the given index.
let renderBlobbyImage = index => {

  let 
  gradient,
  addGradientColorStop = (position, color) => gradient.addColorStop(position, '#' + color),

  sizeOf = array => (array.length),

  imageToRender = blobbyImages[index],

  imageToRenderSize = sizeOf(imageToRender),
  blobbyImagesSize = sizeOf(blobbyImages),

  palettes = blobbyImages[blobbyImagesSize - 1],

  canvas = document.createElement('canvas'),
  context = canvas.getContext('2d');

  context.lineWidth = blobbyImages[blobbyImagesSize - 2];
  context.strokeStyle = '#222';

  canvas.width = imageToRender[imageToRenderSize - 2];
  canvas.height = imageToRender[imageToRenderSize - 1];

  // Render components loop.
  for (let j = 0; j < imageToRenderSize - 2; j++) {
    let 
    points = imageToRender[j], // Points in next component.
    pointsSize = sizeOf(points),
    paletteIndex = points[pointsSize - 1] * 3,
    blobbiness = points[pointsSize - 2],
    gradientRadius = points[pointsSize - 3],
    gradientY = points[pointsSize - 4],
    gradientX = points[pointsSize - 5];

    // Some points need to be duplicated for plotting bezier curves.
    for (let k = 5; k >= 0; k--) points.splice(pointsSize - 5, 0, points[k]);

    context.beginPath();
    context.moveTo(points[2],  points[3]);

    for (let i = 2; i < pointsSize - 4; i += 2) {
      let 
      x1 = points[i],
      y1 = points[i + 1],

      x2 = points[i + 2],
      y2 = points[i + 3];

      context.bezierCurveTo(x1 + ((x2 - (i ? points[i - 2] : points[0])) / 6) * blobbiness, 
                            y1 + ((y2 - (i ? points[i - 1] : points[1])) / 6) * blobbiness, 
                            x2 - (((i !== pointsSize ? points[i + 4] : x2) - x1) / 6) * blobbiness, 
                            y2 - (((i !== pointsSize ? points[i + 5] : y2) - y1) / 6) * blobbiness, 
                            x2, y2);
    }
    context.stroke();

    gradient = context.createRadialGradient(gradientX, gradientY, 1, gradientX, gradientY, gradientRadius);

    addGradientColorStop(0, palettes[paletteIndex ++]);
    addGradientColorStop(.2, palettes[paletteIndex ++]); // + 1.
    addGradientColorStop(.6, palettes[paletteIndex ++]); // + 2.

    context.fillStyle = gradient;

    context.fill();
  }

  return canvas;
};

// Execute this code when the page has fully loaded.
onload = e => {

  for (let i = 0; i < blobbyImages.length - 2; i++) imageContainer.appendChild(renderBlobbyImage(i));

};
