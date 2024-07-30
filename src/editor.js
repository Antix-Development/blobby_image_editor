// Blobby Image Editor
// A basic tool for creating and editing 2d blobby images.
// By Cliff Earl, Antix Development, 2024 (https://github.com/Antix-Development).
// MIT licence.

// #region Utility.

let 
log = (t) => console.log(t),
warn = (t) => console.warn(t),
getByID = (id) => document.getElementById(id),
createElement = (type) => document.createElement(type),
enableElement = (el, state = 0) => el.disabled = !state,
setElementPosition = (el, x, y) => {el.style.left = `${x}px`; el.style.top = `${y}px`;},
showElement = (element, show = true) => element.style.display = (show) ? 'block' : 'none',

clamp = (v, lower, upper) => min(max(v, lower), upper),

//Show the given text in the message label, then fade it out after the given delay.
notify = (t, delay = 1750) => {
  showElement(messageBox);

  messageLabel.innerHTML = t;
  messageBox.classList.remove('fade-out');
  messageBox.classList.add('fade-in');

  setTimeout(e => {
    messageBox.classList.add('fade-out');
  }, delay);
},

// Show or hide the help screen according to the given state.
showHelp = (state = true) => {
  showElement(messageBox, false);
  showElement(help, state);

  helpVisible = state;
},

// Get the child element with the given id from the given container (or null).
getButtonByID = (id, container) => {
  const children = container.children;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child.id * 1 === id) return child;
  }
  return null;
},

// Get the object with the given id from the given array of objects (or null).
getFromArrayByID = (id, arr) => {
  for (let i = 0; i < arr.length; i++) if (arr[i].id === id * 1) return arr[i];
  return null;
},

// Cycle through the buttons in the given array.
cycleThroughButtonsInArray = (referenceObject, array, buttons, direction = 1) => {
  let index = array.indexOf(referenceObject) + direction;
  if (index === array.length) index = 0;
  if (index < 0) index = array.length - 1;

  getButtonByID(array[index].id, buttons).onclick();
},

// Determine of the given array is empty or not.
arrayNotEmpty = arr => (arr.length > 0),

// Enable or disable the delete function according to the given state.
inputActivated = state => anInputIsActive = state,

// #endregion

// #region Variables.

M = Math,
PI = M.PI,
floor = M.floor,
round = M.round,
sqrt = M.sqrt,
sin = M.sin,
cos = M.cos,
min = M.min,
max = M.max,

editorContext = editorCanvas.getContext('2d'),
previewContext = previewCanvas.getContext('2d'),
tempContext = tempCanvas.getContext('2d', {willReadFrequently: true}),

editorBackgroundCanvas = createElement('canvas'),
previewBackgroundCanvas = createElement('canvas'),

selectedImage,
selectedImageListItem,

selectedComponent,
selectedComponentListItem,

hoveredPoint,
selectedPoint,
dotOffsetX = -8,
dotOffsetY = -4,

selectedPalette,
selectedPaletteId,
paletteSwatchContainers = [],
palettes = [], // Palette strings split into arrays of 3 substrings containing rgb string values.

selectedColorInput,
selectedColorIndex,
colorPickerOpen,
lastClickTime,

// Image button reordering.
padID = 0,
activePad,
insertWidth,
buttonBeingDragged,

polygonHighlightColor   = `#fff9`,
polygonCenterColor      = '#08f',
pointColor              = '#f8fc',

lineWidth = 4, // Stroke width used when rendering preview.
previewScale = 1,
doNotRepaint,

editorBounds,
mouseX,
mouseY,
roundedX,
roundedY,

dragging,

helpVisible,

downloadSelectVisible,

anInputIsActive, // Used to gomf certain keyboard events when any input is active.

dataFile,
saveFileName = 'com.antix.blobby.image.editor',
unsavedChanges, // True if something was modified and the user closes the page/tab.
exportedBlobbyImageID = 'exportedBlobbyImage',

// #endregion

// #region - Persistent storage management.

// Load the data file from local storage.
loadDataFile = () => localStorage.getItem(saveFileName),

// Save the data file to local storage.
saveDataFile = () => {
  localStorage.setItem(saveFileName, JSON.stringify(dataFile));
  unsavedChanges = false;
},

// Reset the options to default and save them to local storage
resetDataFile = () => {
  dataFile = {
    uid: 0,

    palettes: [
      'fff,aaa,444',
      'efe,afa,4a4',
      'fcc,f55,a22',
      'eef,aaf,44a',
      'fee,a84,542',
      'ffd,ae7,470',
      'eef,aac,446',
      'fef,faf,a4a'
    ],

    images: [],

    generateComments: true,
    indentCode : true,
    indentSize: 2,
    compactCode: false
  };

  saveDataFile(); // Save options to local storage
},
// #endregion

// #region Palettes

// Open the color picker dialog directly underneath the given target element.
openColorPicker = (target) => {
  const targetBounds = target.getBoundingClientRect();
  showElement(colorPicker);

  setElementPosition(colorPickerDialog, targetBounds.left - 55, targetBounds.bottom);
  colorPickerOpen = true;

  if (selectedColorInput) selectedColorInput.classList.remove('selected');

  selectedColorInput = redColorButton;

  selectedColorInput.classList.add('selected');
  selectedColorInput.click();

  const 
  parts = dataFile.palettes[selectedPaletteId].split(','),
  oldColorString = parts[0];

  redRange.value = parseInt(oldColorString.substr(0, 1), 16);
  greenRange.value = parseInt(oldColorString.substr(1, 1), 16);
  blueRange.value = parseInt(oldColorString.substr(2, 1), 16);

  redColorButton.style.backgroundColor = `#${parts[0]}`;
  redColorButton.style.color = `#${invertColor(parts[0])}`;
  redColorButton.innerHTML = parts[0];

  greenColorButton.style.backgroundColor = `#${parts[1]}`;
  greenColorButton.style.color = `#${invertColor(parts[1])}`;
  greenColorButton.innerHTML = parts[1];

  blueColorButton.style.backgroundColor = `#${parts[2]}`;
  blueColorButton.style.color = `#${invertColor(parts[2])}`;
  blueColorButton.innerHTML = parts[2];
},

// Set the index of the color for the palette being modified so the app knows which color in the palette is being modified.
setSelectedColorIndex = (index, element) => {
  selectedColorIndex = index;

  if (selectedColorInput) selectedColorInput.classList.remove('selected');

  selectedColorInput = element;

  selectedColorInput.classList.add('selected');

  const oldColorString = dataFile.palettes[selectedPaletteId].split(',')[index];

  redRange.value = parseInt(oldColorString.substr(0, 1), 16);
  greenRange.value = parseInt(oldColorString.substr(1, 1), 16);
  blueRange.value = parseInt(oldColorString.substr(2, 1), 16);
},

// Update red component of selected color for the palette being modified.
updateColorRed = (value) => {
  const 
  oldColorString = dataFile.palettes[selectedPaletteId].split(',')[selectedColorIndex], // Get current color string.
  newColorString = '0123456789abcdef'[value] + oldColorString.substring(1); // Create new color string.
  updatePalette(newColorString);
},

// Update green component of selected color for the palette being modified.
updateColorGreen = (value) => {
  const 
  oldColorString = dataFile.palettes[selectedPaletteId].split(',')[selectedColorIndex],
  newColorString = oldColorString[0] + '0123456789abcdef'[value] + oldColorString[2];
  updatePalette(newColorString);
},

// Update blue component of selected color for the palette being modified.
updateColorBlue = (value) => {
  const 
  oldColorString = dataFile.palettes[selectedPaletteId].split(',')[selectedColorIndex],
  newColorString = oldColorString.substring(0, 2) + '0123456789abcdef'[value];
  updatePalette(newColorString);
},

// Update the palette currently being modified.
updatePalette = newColorString => {
  
  selectedColorInput.innerHTML = newColorString;
  selectedColorInput.style.backgroundColor = `#${newColorString}`;
  selectedColorInput.style.color = `#${invertColor(newColorString)}`;

  selectedPalette.children[selectedColorIndex].style.backgroundColor = `#${newColorString}`;

  const oldColorString = dataFile.palettes[selectedPaletteId];

  switch (selectedColorIndex) {
    case 0:

    newColorString = newColorString + oldColorString.substring(3);
      break;
  
    case 1:
      newColorString = oldColorString.substring(0, 4) + newColorString + oldColorString.substring(7);
      break;
  
    case 2:
      newColorString = oldColorString.substring(0, 8) + newColorString;
      break;
  
    default:
      break;
  }

  dataFile.palettes[selectedPaletteId] = newColorString;

  palettes[selectedPaletteId] = newColorString.split(',');

  repaintEditor();
},

// Get the inverted hex color string for the given hex color string.
invertColor = hexColorString => {

  // Convert each character to its decimal equivalent
  const 
  red = 255 - parseInt(hexColorString[0] + hexColorString[0], 16),
  green = 255 - parseInt(hexColorString[1] + hexColorString[1], 16),
  blue = 255 - parseInt(hexColorString[2] + hexColorString[2], 16);

  // Convert the inverted decimal values back to a hexadecimal string
  return ((1 << 24) + (red << 16) + (green << 8) + blue).toString(16).slice(1);
},

// Initialize clickable palettes.
initPalettes = e => {
  for (let j = 0; j < dataFile.palettes.length; j++) {
    const 
    parts = dataFile.palettes[j].split(','),
    container = createElement('div');
    container.classList.add ('rowx', 'paletteContainer');

    palettes.push(parts); // Cache array of split strings.

    for (let i = 0; i < parts.length; i++) {
      const 
      color = parts[i],
      swatch = createElement('div');
      swatch.innerHTML = '&nbsp;'; // NOTE: Possibly redundant.
      swatch.style.backgroundColor = `#${color}`;
      swatch.classList.add ('color');
      container.appendChild(swatch);
      container.id = j;
    }
    paletteContainer.appendChild(container);

    paletteSwatchContainers.push(container); // Lazy code to make disabling all swatches easier to accomplish.

    // When the palette is clicked, unselect any selected palette, then set the clicked palette as the selected palette.
    container.onclick = e => {
      if (container.disabled) return; // Somehow it needs this or it can't detect if its disabled?!?!?!

      if (selectedPalette) {
        selectedPalette.classList.remove('selected');

        // Open color picker for selectedPalette on double-click.
        if (selectedPalette === container) {
          const elapsed = performance.now() - lastClickTime;
          if (elapsed <= 250) openColorPicker(container);
        }
      }
      lastClickTime = performance.now();

      selectedPalette = container;
      selectedPalette.classList.add('selected');
      selectedPaletteId = container.id * 1;

      selectedComponent.palette = selectedPaletteId;

      repaintEditor();
    };
  };
},

// Enable or disable the palette swatches according to the given state.
enablePaletteSwatches = (state = true) => paletteSwatchContainers.forEach(button => {button.disabled = !state;}),

// #endregion

// #region Image

// Reset the styling for the given pad.
resetPadStyle = pad => {
  pad.style.width = '.2rem';
  pad.style.border = 'none';
},

// Handler for when an imageButton has been dropped onto the imageButton container.
imageDropHandler = e => {
  e.preventDefault();

  if (activePad) {
    resetPadStyle(activePad);

    // Move the dropped imageButton to its correct place in the imageButton container.
    const companionPad = buttonBeingDragged.nextElementSibling;
    imageButtonContainer.insertBefore(buttonBeingDragged, activePad.nextElementSibling);
    imageButtonContainer.insertBefore(companionPad, buttonBeingDragged.nextElementSibling);

    // Reorder the image array in the dataFile
    const 
    arr = [],
    buttons = Array.from(imageButtonContainer.getElementsByClassName('imageButton'));
    for (let i = 0; i < buttons.length; i++) arr.push(getFromArrayByID(buttons[i].id, dataFile.images));
    dataFile.images = arr;

    unsavedChanges = true;
  }

  buttonBeingDragged = null;
  activePad = null;
},

// Handler for when an imageButton is being dragged around inside the `imageButton` container.
imageDragOverHandler = e => {
  e.preventDefault();

  const 
  mX = e.pageX,
  mY = e.pageY,
  pads = Array.from(imageButtonContainer.getElementsByClassName('pad'));

  for (let i = 0; i < pads.length; i++) {
    const 
    pad = pads[i],
    bounds = pad.getBoundingClientRect();
    if (mX > bounds.left - 8 && mX < bounds.right + 8 && mY > bounds.top - 2 && mY < bounds.bottom + 2) {

      // Pointer is hovering over a pad.

      if (pad.nextElementSibling === buttonBeingDragged || pad.previousElementSibling === buttonBeingDragged) {

        // Don't do anything if the imagebutton is hovering over the two adjacent pads because if the imageButton was dropped in this case.. it would not need to be repositioned.
        resetPadStyle(pad);
        activePad = null;

      } else {

        // Style the pad so that the user can see where the imageButton will be placed if it dropped at these pointer coordinates.
        pad.style.width = `${insertWidth}px`;
        activePad = pad;
        pad.style.border = '2px solid var(--text-bright-color)';
      }
      
    } else {

      // The pointer is not hovering over any pad.
      resetPadStyle(pad);
    }
  }
},

// Add a new pad label to the `imageButtonContainer`. These are used for drag & drop purposes.
addPadToImageButtonContainer = e => {

  if (!imageButtonContainer.lastElementChild || (imageButtonContainer.lastElementChild && !imageButtonContainer.lastElementChild.classList.contains('pad'))) {
    const pad = createElement('label');
    pad.classList.add('pad');
    pad.id = `pad${padID++}`;
    pad.innerHTML = '&nbsp;';
    imageButtonContainer.appendChild(pad);
  }
},

// Save all images.
saveImages = e => saveDataFile(),

// Add all images to the image list;
initImageArray = e => {
  imageButtonContainer.innerHTML = '';
  for (let i = 0; i < dataFile.images.length; i++) addImageToImageButtonContainer(dataFile.images[i]);
  addPadToImageButtonContainer();
},

// Add the given image to the image list.
addImageToImageButtonContainer = image => {

  addPadToImageButtonContainer();

  let item = createElement('label');
  item.classList.add('item', 'imageButton');
  item.id = image.id;
  item.innerHTML = image.name;
  imageButtonContainer.appendChild(item);
  item.scrollIntoView();

  item.draggable = true;

  // Handler for when the item is first being dragged.
  item.ondragstart = e => {
    insertWidth = item.getBoundingClientRect().width + 10;
    buttonBeingDragged = item;
  };

  // Handler for when the item is dropped.
  item.ondragend = e => {
    item.style.cursor = 'default';
  };

  // List item click event handler.
  item.onclick = e => {
    if (selectedImageListItem) selectedImageListItem.classList.remove('selected'); // Unselect currently selected list item.
    item.classList.add('selected');

    const image = getFromArrayByID(item.id, dataFile.images);

    selectedImageListItem = item;
    selectedImage = image;

    imageNameInput.value = image.name;

    imageNameInput.disabled = false;
    deleteImageButton.disabled = false;

    downloadImagesButton.disabled = false;

    duplicateImageButton.disabled = false;
    flipImageXButton.disabled = false;
    flipImageYButton.disabled = false;

    saveImagesButton.disabled = false;

    openColorPickerButton.disabled = true;

    pointButtonContainer.innerHTML = '';
    disablePointUI();
    
    selectedComponent = null;
    selectedPoint = null;

    updateDots();

    disableComponentUI();

    initComponentList();

    if (image.components.length > 0) addComponentButton.disabled = false;
    repaintEditor();
  }

  unsavedChanges = true;

  return item;
},

// Duplicate the selected image.
duplicateImage = e => {
  const imageToCopy = selectedImage;
  addImage(`${selectedImage.name} - Copy`);

  if (arrayNotEmpty(imageToCopy.components)) {
    const componentsToDuplicate = imageToCopy.components;

    for (let i = 0; i < componentsToDuplicate.length; i++) {
      const 
      componentToDuplicate = componentsToDuplicate[i],
      pointsToDuplicate = componentToDuplicate.points;

      addComponent(); // The duplicated component will be made the selected component.

      selectedComponent.name = componentToDuplicate.name;
      selectedComponent.z = componentToDuplicate.z * 1;
      selectedComponent.blobbiness = componentToDuplicate.blobbiness * 1;
      selectedComponent.palette = componentToDuplicate.palette * 1;

      componentNameInput.value = selectedComponent.name;
      selectedComponentListItem.innerHTML = selectedComponent.name;

      // Recreate the components points, displacing each one to the left and down by the given offset (in pixels).
      for (let i = 0; i < pointsToDuplicate.length; i++) {
        const pointToDuplicate = pointsToDuplicate[i];

        addPoint(pointToDuplicate.x, pointToDuplicate.y);

      }      
    }
  }
  updateDots();
  repaintEditor();

  unsavedChanges = true;
},

// Get the center of the selected image.
getImageCenter = e => {
    let 
    minX = 512,
    minY = 512,
    maxX = 0,
    maxY = 0;

    selectedImage.components.forEach(component => {
      component.points.forEach(point => {
        if (point.x < minX) minX = point.x;
        if (point.x > maxX) maxX = point.x;
        if (point.y < minY) minY = point.y;
        if (point.y > maxY) maxY = point.y;
      });
    });

    return {
      x: (minX + maxX) / 2, 
      y: (minY + maxY) / 2
    };
},

// Flip selected image on x axis.
flipImageX = e => {
  if (arrayNotEmpty(selectedImage.components)) {
    const 
    center = getImageCenter(),
    componentsToFlip = selectedImage.components;
    for (let i = 0; i < componentsToFlip.length; i++) {
      const 
      componentToFlip = componentsToFlip[i],
      points = componentToFlip.points;
      for (let i = 0; i < points.length; i++) {
        const point = points[i];
        point.x = round(center.x - (point.x - center.x));
        if (selectedPoint) getButtonByID(point.id, pointButtonContainer).innerHTML = (`${point.x}, ${point.y}`);
      }
    }
    updateDots();
    repaintEditor();

    unsavedChanges = true;
  }
},

// Flip selected image on y axis.
flipImageY = e => {
  if (arrayNotEmpty(selectedImage.components)) {
    const 
    center = getImageCenter(),
    componentsToFlip = selectedImage.components;
    for (let i = 0; i < componentsToFlip.length; i++) {
      const 
      componentToFlip = componentsToFlip[i],
      points = componentToFlip.points;
      for (let i = 0; i < points.length; i++) {
        const point = points[i];
        point.y = round(center.y - (point.y - center.y));
        if (selectedPoint) getButtonByID(point.id, pointButtonContainer).innerHTML = (`${point.x}, ${point.y}`);
      }
    }
    updateDots();
    repaintEditor();

    unsavedChanges = true;
  }
},

// Create a new image.
addImage = imageName => {
  let newImage = {
    id: dataFile.uid++,
    type: 'image',
    name: (imageName) ? imageName : `image${dataFile.uid}`,
    x: 0,
    y: 0,
    w: 0,
    h: 0,
    components: [],
  };
  dataFile.images.push(newImage);

  selectedImage = null;
  selectedComponent = null;
  selectedPoint = null;

  addImageToImageButtonContainer(newImage).onclick(); // Add the new image to the list of images, then invoke it's `onclick` method.

  addPadToImageButtonContainer();

  addComponentButton.disabled = false;
  saveImagesButton.disabled = false;

  repaintEditor();

  unsavedChanges = true;

  return selectedImage;
},

// Delete the currently selected image.
deleteImage = e => {
  if (!selectedImage) return;

  let images = dataFile.images;
  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    if (image === selectedImage) {
      imageButtonContainer.removeChild(selectedImageListItem.nextElementSibling); // Remove pad.
      imageButtonContainer.removeChild(selectedImageListItem); // Remove list item.
      selectedImageListItem = null;

      images.splice(i, 1); // Remove from images array.
      selectedImage = null;

      outputCode.innerHTML = '';

      imageNameInput.value = '';

      imageNameInput.disabled = true;
      deleteImageButton.disabled = true;
      downloadImagesButton.disabled = true;

      duplicateImageButton.disabled = true;
      flipImageXButton.disabled = true;
      flipImageYButton.disabled = true;

      componentButtonContainer.innerHTML = '';
      pointButtonContainer.innerHTML = '';

      selectedComponent = null;
      selectedPoint = null;

      disableComponentUI();
      disablePointUI();

      addComponentButton.disabled = true;

      updateDots();
      repaintEditor();

      unsavedChanges = true;
    }
  }
},

// Update image name in images array and list.
updateImageName = e => {
  if (!selectedImage) return;
  selectedImage.name = imageNameInput.value;
  selectedImageListItem.innerHTML = selectedImage.name;

  unsavedChanges = true;
},
// #endregion

// #region - Component.

initComponentList = e => {
  componentButtonContainer.innerHTML = '';
  for (let i = 0; i < selectedImage.components.length; i++) addComponentToList(selectedImage.components[i]);
},

// Add the given component to the `componentButtonContainer`.
addComponentToList = component => {
  let item = createElement('label');
  item.classList.add('item');
  item.id = component.id;
  item.innerHTML = component.name;
  componentButtonContainer.appendChild(item);
  item.scrollIntoView();

  // List item click event handler.
  item.onclick = e => {

    if (selectedComponentListItem) {
      selectedComponentListItem.classList.remove('selected'); // Unselect currently selected list item.
      setElementPosition(dotSelect, -50, -50);
      setElementPosition(dotHover, -50, -50);
    }
    item.classList.add('selected');

    const component = getFromArrayByID(item.id, selectedImage.components);

    selectedComponentListItem = item;
    selectedComponent = component;
    
    componentNameInput.value = component.name;

    componentBlobbinessInput.value = component.blobbiness;
    componentBlobbinessRange.value = component.blobbiness;

    componentZIndexInput.value = component.z;
    componentZIndexRange.value = component.z;

    componentNameInput.disabled = false;

    addComponentButton.disabled = false;

    deleteComponentButton.disabled = false;

    componentBlobbinessRange.disabled = false;
    componentBlobbinessInput.disabled = false;
    componentZIndexRange.disabled = false;
    componentZIndexInput.disabled = false;

    duplicateComponentButton.disabled = false;
    flipComponentXButton.disabled = false;
    flipComponentYButton.disabled = false;
  
    const container = paletteContainer.children[component.palette];

    if (selectedPalette) selectedPalette.classList.remove('selected');
    selectedPalette = container;
    container.classList.add('selected');
    container.disabled = false;

    selectedPoint = null;

    selectedPaletteId = container.id * 1;

    enablePaletteSwatches();

    openColorPickerButton.disabled = false;

    initComponentPointsArray();

    if (component.points.length > 0) {
      clearPointsButton.disabled = false;
      getButtonByID(component.points[0].id, pointButtonContainer).onclick(); // Select the first point.
    }

    updateDots();
    repaintEditor();
  }
  return item;
},

// Create a new component.
addComponent = e => {
  let newComponent = {
    id: dataFile.uid++,
    type: 'component',
    name: `component${dataFile.uid}`,
    center: {
      x: 0,
      y: 0,
    },
    blobbiness: 0,
    z: 0,
    points: [],
    palette: 0,
  };
  selectedImage.components.push(newComponent);

  addComponentToList(newComponent).onclick(); // Add the new component to the list of components, then invoke it's `onclick` method.

  selectedPaletteId = 0;

  addComponentButton.disabled = false;

  unsavedChanges = true;

  return newComponent;
},

// Delete the selected component.
deleteComponent = e => {
  if (!selectedComponent) return;

  let components = selectedImage.components;
  for (let i = 0; i < components.length; i++) {
    const component = components[i];
    if (component === selectedComponent) {
      componentButtonContainer.removeChild(selectedComponentListItem); // Remove list item.
      selectedComponentListItem = null;

      components.splice(i, 1); // Remove from components array.
      selectedComponent = null;

      selectedPoint = null;
      pointButtonContainer.innerHTML = '';

      disablePointUI();

      disableComponentUI();

      updateDots();
      repaintEditor();

      unsavedChanges = true;
    }
  }
},

// Disable component editing controls.
disableComponentUI = e => {
  componentNameInput.value = '';
  componentNameInput.disabled = true;

  componentBlobbinessRange.value = 0;
  componentBlobbinessRange.disabled = true;

  componentBlobbinessInput.value = '';
  componentBlobbinessInput.disabled = true;

  componentZIndexRange.value = 0;
  componentZIndexRange.disabled = true;

  componentZIndexInput.value = '';
  componentZIndexInput.disabled = true;

  if (selectedPalette) selectedPalette.classList.remove('selected');
  enablePaletteSwatches(false);

  deleteComponentButton.disabled = true;

  duplicateComponentButton.disabled = true;
  flipComponentXButton.disabled = true;
  flipComponentYButton.disabled = true;
},

// Update component name in components array and list.
updateComponentName = e => {
  if (!selectedComponent) return;
  selectedComponent.name = componentNameInput.value;
  selectedComponentListItem.innerHTML = selectedComponent.name;

  unsavedChanges = true;
},

// Update component blobbiness.
updateComponentBlobbiness = (v, invokedByRange) => {
  if (!invokedByRange) {
    // Validate and correct bad numeric input values.
    v = (v < 0) ? 0 : (v > 1) ? 1 : v;
    componentBlobbinessInput.value = v;
    componentBlobbinessRange.value = v;

  } else {
    // Range was used so set input accordingly.
    componentBlobbinessInput.value = v;
  }

  selectedComponent.blobbiness = v * 1;

  repaintEditor();

  unsavedChanges = true;
},

// Update component z index.
updateComponentZindex = (v, invokedByRange) => {
  if (!invokedByRange) {
    // Validate and correct bad numeric input values.
    v = (v < 0) ? 0 : (v > 5) ? 5 : v;
    componentZIndexInput.value = v;
    componentZIndexRange.value = v;

  } else {
    // Range was used so set input accordingly.
    componentZIndexInput.value = v;
  }

  selectedComponent.z = v * 1;

  repaintPreview();

  unsavedChanges = true;
},

// Flip selected component on x axis.
flipComponentX = e => {
  const 
  center = selectedComponent.center,
  points = selectedComponent.points;
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    point.x = round(center.x - (point.x - center.x));
    getButtonByID(point.id, pointButtonContainer).innerHTML = (`${point.x}, ${point.y}`);
  }
  updateDots();
  repaintEditor();

  unsavedChanges = true;
},

// Flip selected component on y axis.
flipComponentY = e => {
  const 
  center = selectedComponent.center,
  points = selectedComponent.points;
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    point.y = round(center.y - (point.y - center.y));
    getButtonByID(point.id, pointButtonContainer).innerHTML = (`${point.x}, ${point.y}`);
  }
  updateDots();
  repaintEditor();

  unsavedChanges = true;
},

// Create a duplicate of the selected component.
duplicateComponent = offset => {
  const 
  oldComponent = selectedComponent,
  oldPoints = oldComponent.points;

  addComponent();

  selectedComponent.z = oldComponent.z * 1;
  selectedComponent.blobbiness = oldComponent.blobbiness * 1;
  selectedComponent.palette = oldComponent.palette * 1;

  // Recreate the components points, displacing each one to the left and down by the given offset (in pixels).
  for (let i = 0; i < oldPoints.length; i++) {
    const oldPoint = oldPoints[i];
    
    addPoint(clamp(oldPoint.x + offset, 0, 510), clamp(oldPoint.y + offset, 0, 510));

  }

  updateDots();
  repaintEditor();

  unsavedChanges = true;
},

// #endregion

// #region Point

// add a new point to the selected component with the given coordinates.
addPoint = (x = 0, y = 0) => {
  const newPoint = {
    id: dataFile.uid++,
    type: 'point',
    x: x,
    y: y,
    a: 0,
  };
  selectedComponent.points.push(newPoint);

  addPointToPointButtonContainer(newPoint).onclick();

  deletePointButton.disabled = false;
  clearPointsButton.disabled = false;
  pointXInput.disabled = false;
  pointYInput.disabled = false;

  return newPoint;
},

// Disable point editing interface elements.
disablePointUI = e => {
  deletePointButton.disabled = true;
  clearPointsButton.disabled = true;
  pointXInput.value = '';
  pointXInput.disabled = true;
  pointYInput.value = '';
  pointYInput.disabled = true;
},

// Get the point with the given id (or null).
getPointByID = id => {
  for (let i = 0; i < selectedComponent.points.length; i++) if (selectedComponent.points[i].id === id * 1) return selectedComponent.points[i];
  return null;
},

// Move the given point according to the given movement deltas.
moveSinglePoint = (point, dX, dY) => {

  point.x = clamp(point.x + dX, 0, 510);
  point.y = clamp(point.y + dY, 0, 510);
  const button = getButtonByID(point.id, pointButtonContainer);
  if (button) {
    button.innerHTML = `${point.x}, ${point.y}`;
    if (point == selectedPoint) {
      pointXInput.value = point.x;
      pointYInput.value = point.y;
    }
  }

  unsavedChanges = true;
},

// Move selected point, or all points of the selected component if the shift key is being held.
moveMultiplePoints = (dX, dY, shiftHeld, ctrlHeld) => {
  
  if (ctrlHeld && selectedImage) {

    // 
    // Move entire image.
    // 

    const components = selectedImage.components;

    for (let j = 0; j < components.length; j++) {
      const component = components[j];

      for (let i = 0; i < component.points.length; i++) {
        const point = component.points[i];

        point.x = clamp(point.x + dX, 0, 510);
        point.y = clamp(point.y + dY, 0, 510);
        const button = getButtonByID(point.id, pointButtonContainer);
        if (button) {
          button.innerHTML = `${point.x}, ${point.y}`;
          if (point == selectedPoint) {
            pointXInput.value = point.x;
            pointYInput.value = point.y;
          }
        }
      }
    }
    updateDots();
    repaintEditor();

    unsavedChanges = true;

    return;
  } 

  if (selectedPoint) {

    if (shiftHeld) {

      // 
      // Move entire component.
      // 

      for (let i = 0; i < selectedComponent.points.length; i++) moveSinglePoint(selectedComponent.points[i], dX, dY);

    } else {

      // 
      // Move single point.
      // 

      moveSinglePoint(selectedPoint, dX, dY);
    }
    pointXInput.value = selectedPoint.x;
    pointYInput.value = selectedPoint.y;

    updateDots();
    repaintEditor();

    unsavedChanges = true;
  }
},

// Update positions for selection dots.
updateDots = e => {
  setElementPosition(dotHover, -50, -50);

  if (selectedPoint) {
    let 
    x = editorBounds.left + selectedPoint.x + dotOffsetX,
    y = editorBounds.top + selectedPoint.y + dotOffsetY;
      setElementPosition(dotSelect, x, y);

    } else {
      
    setElementPosition(dotSelect, -50, -50);
  }
},

// Populate the points array for the currently selected component.
initComponentPointsArray = e => {
  pointButtonContainer.innerHTML = '';
  for (let i = 0; i < selectedComponent.points.length; i++) addPointToPointButtonContainer(selectedComponent.points[i]);
},

// Add the given point to the point button container as a button.
addPointToPointButtonContainer = point => {
  
  let item = createElement('span');
  item.classList.add('item');
  item.id = point.id;
  item.innerHTML = `${point.x}, ${point.y}`;
  pointButtonContainer.appendChild(item);

  // Handle event where item is clicked in list.
  item.onclick = e => {
    if (selectedPoint === item) return;

    if (selectedPoint) getButtonByID(selectedPoint.id, pointButtonContainer).classList.remove('selected');

    item.classList.add('selected');
    
    selectedPoint = getPointByID(item.id);
    deletePointButton.disabled = false;

    pointXInput.value = point.x;
    pointXInput.disabled = false;

    pointYInput.value = point.y;
    pointYInput.disabled = false;

    x = editorBounds.left + selectedPoint.x + dotOffsetX ,
    y = editorBounds.top + selectedPoint.y + dotOffsetY;

    setElementPosition(dotHover, -50, -50);
    setElementPosition(dotSelect, x, y);
  }

  // Highlight the item when the user hovers the mouse over it.
  item.onpointerenter = e => {
    editorBounds = editorCanvas.getBoundingClientRect();

    let point = getPointByID(item.id);
    
    x = editorBounds.left + point.x + dotOffsetX ,
    y = editorBounds.top + point.y + dotOffsetY;
    setElementPosition(dotHover, x, y);
  };

  unsavedChanges = true;

  return item;
},

// Delete the selected point.
deletePoint = e => {
  const points = selectedComponent.points;

  for (let i = 0; i < points.length; i++) {

    if (points[i] === selectedPoint) {

      pointButtonContainer.removeChild(getButtonByID(selectedPoint.id, pointButtonContainer));

      selectedPoint = null;

      points.splice(i, 1);

      disablePointUI();

      if (points.length > 0) clearPointsButton.disabled = false;

      updateDots();
      repaintEditor();

      unsavedChanges = true;

      return;
    }
  }
},

// Clear selected component points array.
clearPointsArray = e => {
  selectedPoint = null;
  pointButtonContainer.innerHTML = '';
  selectedComponent.points = [];
  updateDots();
  repaintEditor();
},

// Update selected point x position with the given value.
updatePointX = v => {
    selectedPoint.x = v * 1;
    getButtonByID(selectedPoint.id, pointButtonContainer).innerHTML = `${selectedPoint.x}, ${selectedPoint.y}`;
    updateDots();
    repaintEditor();

    unsavedChanges = true;
},

// Update selected point y position with the given value.
updatePointY = v => {
  selectedPoint.y = v * 1;
  getButtonByID(selectedPoint.id, pointButtonContainer).innerHTML = `${selectedPoint.x}, ${selectedPoint.y}`;
  updateDots();
  repaintEditor();

  unsavedChanges = true;
},

// Handle pointer move events for editor.
editorPointerMoveHandler = e => {
  editorBounds = editorCanvas.getBoundingClientRect();

  const 
  scaleX = editorCanvas.width / editorBounds.width,
  scaleY = editorCanvas.height / editorBounds.height;

  mouseX = (e.clientX - editorBounds.left) * scaleX;
  mouseY = (e.clientY - editorBounds.top) * scaleY;

  // Round to the nearest multiple of 2
  roundedX = round(mouseX / 2) * 2;
  roundedY = round(mouseY / 2) * 2;

  if (dragging) {

    // Move the selected point.

    selectedPoint.x = roundedX;
    selectedPoint.y = roundedY;

    pointXInput.value = selectedPoint.x;
    pointYInput.value = selectedPoint.y;

    getButtonByID(selectedPoint.id, pointButtonContainer).innerHTML = `${selectedPoint.x}, ${selectedPoint.y}`;

    updateDots();
    repaintEditor();

    unsavedChanges = true;

  } else {

    // Determine which point (if any) the pointer is hovering over.

    if (selectedImage) {
      if (selectedComponent) {

        let points = selectedComponent.points;

        for (let i = 0; i < points.length; i++) {
          const point = points[i],
          dX = point.x - mouseX,
          dY = point.y - mouseY;
    
          // If pointer is close to this point, highlight the point and save the index in the point array.
          if (sqrt(dX * dX + dY * dY) < 10) {

            setElementPosition(dotHover, editorBounds.left + point.x + dotOffsetX, editorBounds.top + point.y + dotOffsetY); // Highlight point mouse is over.
            hoveredPoint = point;
            
            e.stopImmediatePropagation();
            return;
          }
        }
        // Mouse is not hovering over any point.
        setElementPosition(dotHover, -50, -50);
        hoveredPoint = null;
      }
    }
  }
},

// Determine if the given point is inside the given polygon (https://stackoverflow.com/questions/22521982/check-if-point-is-inside-a-polygon)
pointInPolygon = (point, polygon) => {
  let 
  x = point.x, 
  y = point.y,
  xi,
  xj,
  inside;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    xi = polygon[i].x, yi = polygon[i].y;
    xj = polygon[j].x, yj = polygon[j].y;
    if (((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
},

// Handle pointer up events for editor.
editorPointerUpHandler = e => {
  switch (e.button) {
    case 2: // Right button

      // Select the component that the mouse was clicked inside of (if any).

      if (selectedImage) {
        let components = selectedImage.components.sort((a, b) => b.z - a.z);

        for (let i = 0; i < components.length; i++) {
          const component = components[i];
  
          if (pointInPolygon({x: mouseX, y: mouseY}, component.points)) {
            selectedPoint = null;
  
            getButtonByID(component.id, componentButtonContainer).onclick();
  
            return;
          }
        }
  
      }
      break;
  
    case 0: // Left button.

      if (selectedComponent) {
        if (dragging) {
          dragging = false;
          return;
        }

        // Nothing was being dragged so add a new point to the currently selected component.

        addPoint(roundedX, roundedY);

        repaintEditor();

        unsavedChanges = true;
      }
      break;
  
    default:
      break;
  }
},

// Handle pointer down events for editor.
editorPointerDownHandler = e => {
  if (e.button != 0) return;

  if (hoveredPoint) {

    // Set the selected point.

    getButtonByID(hoveredPoint.id, pointButtonContainer).onclick();
    dragging = true;
    hoveredPoint = null;
  }
},

// Draw the given polygon on the editor canvas, in the given color, with the given line width.
drawPolygon = (polygon, color, lineWidth = 1) => {
  editorContext.lineWidth = lineWidth;
  editorContext.strokeStyle = color;
  editorContext.beginPath();
  editorContext.moveTo(polygon[0].x, polygon[0].y)
  for (let j = 1; j < polygon.length; j++) editorContext.lineTo(polygon[j].x, polygon[j].y);
  editorContext.closePath();
  editorContext.stroke();
  editorContext.lineWidth = 1;
},

// #region Repaint Editor and Preview

// Repaint the editor pane.
repaintEditor = e => {

  if (doNotRepaint) return;

  editorContext.drawImage(editorBackgroundCanvas, 0, 0);

  if (selectedImage) {

    // Render the currently selected image.
    
    if (selectedImage.components.length > 0) {

      selectedImage.components = selectedImage.components.sort((a, b) => a.z - b.z); // Sort components into z order

      for (let i = 0; i < selectedImage.components.length; i++) {
        let 
        component = selectedImage.components[i],
        points = component.points;

        if (points.length > 2) { // If there are 3 or more points, there is a polygon to be drawn.
          // Calculate polygon center.
          component.center = points.reduce((acc, p) => ({x: acc.x + p.x, y: acc.y + p.y}), {x: 0, y: 0, a: 0});
          component.center.x /= points.length;
          component.center.y /= points.length;

          // Calculate angle from polygons center for each point (0 - 360), then sort them into clockwise order.
          points = points.map(({x, y, id, type, name}) => ({id, type, name, x, y, a: Math.atan2(y - component.center.y, x - component.center.x) * 180 / Math.PI})).sort((a, b) => a.a - b.a);

          component.points.forEach(componentPoint => {
            points.forEach(point => {
              if (point.id === componentPoint.id) componentPoint.a = point.a;
            });
          });
  
          editorContext.fillStyle = polygonCenterColor;
          editorContext.fillRect(component.center.x - 3, component.center.y - 3, 7, 7);

          drawPolygon(points, `#${palettes[component.palette][1]}`);

          if (component === selectedComponent) drawPolygon(points, polygonHighlightColor, 5); 
        }

        // Draw all points.
        editorContext.fillStyle = pointColor;
        for (let i = 0; i < points.length; i++) {
          const point = points[i];
          editorContext.fillRect(point.x - 3, point.y - 3, 6, 6);
        }
      }
    }
  }
  repaintPreview();
},

// Get the bounding box for the given flattened array of points.
getBoundingBox = points => {
  let 
  minX = 510,
  minY = 510,
  maxX = 0,
  maxY = 0;

  for (let i = 0; i < points.length; i+=2) {

    if (points[i] < minX) minX = points[i];
    if (points[i] > maxX) maxX = points[i];
    
    if (points[ i + 1] < minY) minY = points[i + 1];
    if (points[i + 1] > maxY) maxY = points[i + 1];
  }

  return {
    x: minX,
    y: minY,
    w: maxX - minX,
    h: maxY - minY
  };
},

// Get the bounding box for the given context (http://phrogz.net/tmp/canvas_bounding_box2.html).
getContextBoundingBox = ctx => {
  let 
  w = 512,
  h = 512,
  x,
  y,
  left,
  top,
  right,
  bottom,
  data = ctx.getImageData(0, 0, w, h).data;

  a: for (y = h; y--;) for (x = w; x--;)if (data[(w * y + x) * 4 + 3]) { bottom = y; break a }
  if (!bottom) return;
  b: for (x = w; x--;) for (y = bottom + 1; y--;) if (data[(w * y + x) * 4 + 3]) { right = x; break b }
  c: for (x = 0; x <= right; ++x) for (y = bottom + 1; y--;) if (data[(w * y + x) * 4 + 3]) { left = x; break c }
  d: for (y = 0; y <= bottom; ++y) for (x = left; x <= right; ++x) if (data[(w * y + x) * 4 + 3]) { top = y; break d }

  return {left, top, right, bottom, w: right - left, h: bottom - top};
},

// Set the preview rendering scale to the selected option.
previewScaleSelected = scale => {
  previewScale = [1, .5, .25, .125, .0625][scale];

  repaintPreview();
},

// Repaint the preview pane.
repaintPreview = e => {

  if (doNotRepaint) return;

  previewCanvas.width = previewCanvas.width;

  previewContext.drawImage(previewBackgroundCanvas, 0, 0);

  if (selectedImage) {

    if (arrayNotEmpty(selectedImage.components)) {

      const components = selectedImage.components.sort((a, b) => a.z - b.z);

      for (let i = 0; i < components.length; i++) {

        const component = components[i];

        if (component.points.length > 2) {

          let 
          blobbiness = component.blobbiness,

          points = component.points.sort((a, b) => a.a - b.a).map(({x, y}) => [x * previewScale, y * previewScale]); // Sort in clockwise order, then map to an array.
    
          points.unshift(points[points.length - 1]); // Close.
          points.unshift(points[points.length - 2]);
          points.push(points[2]);
          points.push(points[3]);
    
          points = points.flat(); // Flatten.
  
          let last = points.length;

          previewContext.lineWidth = lineWidth * previewScale ;
          previewContext.strokeStyle = '#222';

          previewContext.beginPath();
          previewContext.moveTo(points[2],  points[3]);
    
          for (let i = 2; i < last - 4; i += 2) {
            let 
            x1 = points[i],
            y1 = points[i + 1],
    
            x2 = points[i + 2],
            y2 = points[i + 3];

            previewContext.bezierCurveTo(x1 + ((x2 - (i ? points[i - 2] : points[0])) / 6) * blobbiness, 
                                         y1 + ((y2 - (i ? points[i - 1] : points[1])) / 6) * blobbiness, 
                                         x2 - (((i !== last ? points[i + 4] : x2) - x1) / 6) * blobbiness, 
                                         y2 - (((i !== last ? points[i + 5] : y2) - y1) / 6) * blobbiness, 
                                         x2, y2);
          }
          previewContext.stroke();
    
          let 
          bounds = getBoundingBox(points),
          x0,
          y0,
          r1;

          if (bounds.w > bounds.h) {
            // Stretch the gradient horizontally.
            x0 = bounds.x + (bounds.w * .3);
            y0 = bounds.y + (bounds.h * .2);
            r1 = bounds.w * .9;

          } else {
            // Stretch the gradient vertically.
            x0 = bounds.x + (bounds.w * .2);
            y0 = bounds.y + (bounds.h * .3);
            r1 = bounds.h * .9;
          }

          // Save gradient params to component.
          component.x0 = floor(x0);
          component.y0 = floor(y0);
          component.r1 = floor(r1);
          
          let 
          gradient = previewContext.createRadialGradient(x0, y0, 1, x0, y0, r1),
          palette = palettes[component.palette];
      
          // Add color stops
          gradient.addColorStop(0, `#${palette[0]}`);
          gradient.addColorStop(.2, `#${palette[1]}`);
          gradient.addColorStop(.6, `#${palette[2]}`);
      
          previewContext.fillStyle = gradient;
          previewContext.fill();
        }
      }
    }

  }
},

// #endregion

// #region Download / Upload.

// Select only the currently selected image for download.
selectSelectedImageForDownload = e => {
  if (selectedImage) {
    selectNoImagesForDownload();
    getButtonByID(selectedImage.id, downloadSelectList).classList.add('selected');
  
  } else {

    notify('No images selected.');
  }
},

// Select all images for download.
selectAllImagesForDownload = e => {
  for (let i = 0; i < downloadSelectList.children.length; i++) downloadSelectList.children[i].classList.add('selected');
},

// Select no images for download.
selectNoImagesForDownload = e => {
  for (let i = 0; i < downloadSelectList.children.length; i++) downloadSelectList.children[i].classList.remove('selected');
},

// Cancel image download (just close the dialog).
cancelImageDownload = e => {
  showElement(downloadSelect, false);
  downloadSelectVisible = false;
},

// Repackage selected images (in download dialog) for downloading.
downloadImages = e => {
  const 
  arrayToDownload = [],
  items = Array.from(downloadSelectList.getElementsByClassName('selected'));

  for (let i = 0; i < items.length; i++) {
    const image = getFromArrayByID(items[i].id, dataFile.images);

    // Repackage image.
    const 
    imageToExport = {
      id: exportedBlobbyImageID,
      name: image.name,
      x: image.x,
      y: image.y,
      w: image.w,
      h: image.h,
      components: []
    },
    
    // Repackage components.
    componentsToExport = image.components;

    for (let i = 0; i < componentsToExport.length; i++) {

      const component = componentsToExport[i],

      componentToExport = {
        name: component.name,
        blobbiness: component.blobbiness,
        z: component.z,
        points: [],
        palette: component.palette,
      },

      // Repackage points.
      pointsToExport = component.points;

      for (let j = 0; j < pointsToExport.length; j++) {

        const point = pointsToExport[j];

        componentToExport.points.push({
          x: point.x,
          y: point.y
        });
      }
      imageToExport.components.push(componentToExport);
    }

    arrayToDownload.push(imageToExport);
  }

  cancelImageDownload();

  if (arrayNotEmpty(arrayToDownload)) {
    downloadObjectAsJson(arrayToDownload, 'exported.json'); // Download the export package.

  } else {
    notify('No images selected to download.');

  }
},

// Open the download dialog.
openDownloadSelect = e => {

  // Generate list items.
  downloadSelectList.innerHTML = '';

  // Populate list.
  const images = dataFile.images;
  for (let i = 0; i < images.length; i++) {
    const 
    image = images[i],

    item = createElement('li');

    item.classList.add('listItem')
    item.innerHTML = image.name;
    item.id = image.id;

    item.onclick = e => item.classList.toggle('selected');

    downloadSelectList.appendChild(item);
  }

  showElement(downloadSelect);

  downloadSelectVisible = true;
},

// Stringify the given object and download it to the users downloads folder as the given filename.
downloadObjectAsJson = (obj, fileName) => {

  const 
  jsonString = JSON.stringify(obj),

  blob = new Blob([jsonString], { type: 'application/json' }),

  url = URL.createObjectURL(blob),

  a = createElement('a');

  a.href = url;
  a.download = fileName;

  document.body.appendChild(a);

  a.click(); // Start the download.

  document.body.removeChild(a);

  URL.revokeObjectURL(url);
},

// Upload the image (or array of images) that the user selected.
uploadImages = e => {

  const file = e.target.files[0];

  if (file) {
    const reader = new FileReader();

    // Execute this when the file has been read from persistent storage.
    reader.onload = e => {

      fileInput.value = ''; // Clear so this file can be uploaded repeatedly.

      doNotRepaint = true;

      const importedData = JSON.parse(e.target.result);

      let 
      count = importedData.length,
      success = false,
      succeeded = 0,
      failed = 0;

      for (let i = 0; i < importedData.length; i++) {

        success = success | recreateImportedImage(importedData[i]);

        if (success) {
          succeeded ++;

        } else {
          failed ++;
        }
      }

      doNotRepaint = false;

      if (success) {

        // Only repaint if something actually loaded.

        repaintEditor();
        unsavedChanges = true;

      }

      notify(`${count} blobby images loaded. ${succeeded} succeeded,  ${failed} failed.`);

    };

    reader.readAsText(file); // Start it loading.

  } else {

    notify('No file selected.');

  }
},

// Try to make the name of the given imported image unique.
checkImportedImageName = importedImage => {
  const existingImages = dataFile.images;
  for (let i = 0; i < existingImages.length; i++) {
    if (existingImages[i].name === importedImage.name) {
      importedImage.name += `_${dataFile.uid++}`;
      return;
    }
  }
};

// Recreate the given imported image.
recreateImportedImage = importedImage => {
  if ((importedImage.id) && (importedImage.id === exportedBlobbyImageID)) {

    checkImportedImageName(importedImage);

    // Recreate the imported image.
    const newImage = addImage(importedImage.name);
    newImage.x = importedImage.x;
    newImage.y = importedImage.y;
    newImage.w = importedImage.w;
    newImage.h = importedImage.h;

    // Recreate the imported components.
    const importedComponents = importedImage.components;
    if (arrayNotEmpty(importedComponents)) {
      for (let i = 0; i < importedComponents.length; i++) {
        const 
        importedComponent = importedComponents[i],
        newComponent = addComponent();

        newComponent.name = importedComponent.name;
        newComponent.z = importedComponent.z;
        newComponent.blobbiness = importedComponent.blobbiness;
        newComponent.palette = importedComponent.palette;

        // Recreate the imported points.
        const importedPoints = importedComponent.points;
        if (arrayNotEmpty(importedPoints)) {
          for (let j = 0; j < importedPoints.length; j++) {
            const point = importedPoints[j];
            addPoint(point.x, point.y);
          }
        }
      }
    }
    return true;
  }

  return false;
},

// #endregion

// #region Export.

// Write the innerText of the given element to the system clipboard.
writeClipboardText = async element => {
  const txt = element.innerText;
  if (txt != '') {
    try {
      await navigator.clipboard.writeText(element.innerText);
  
      notify('Copied to clipboard.');
  
    } catch (error) {
      warn(error.message);
  
    }
  }
},

// Enanle or disable exported code comment generation according to the given state.
enableCommentGeneration = state => dataFile.generateComments = state,

// Enanle or disable exported code indentation according to the given state.
enableIndentGeneration = state => dataFile.indentCode = state,

// Set indentation size for exported code.
setIndentSize = v => dataFile.indentSize = v * 1,

// Return an indentated string calculated by the current indentation size multiplied by the given number.
indentCode = tabs => ((dataFile.indentCode && !dataFile.compactCode) ? ''.padStart(dataFile.indentSize * tabs, ' ') : ''),

// Enanle or disable exported code compacting according to the given state.
setCodeCompacting = state => {
  dataFile.compactCode = state;

  if (state) {

    generateCommentsCheckbox.disabled = true;
    indentCodeCheckbox.disabled = true;
    indentSizeInput.disabled = true;

  } else {

    generateCommentsCheckbox.disabled = false;
    indentCodeCheckbox.disabled = false;
    indentSizeInput.disabled = false;

  }
},
// Get a newline string if exported code compacting is disabled.
newLine = e => ((dataFile.compactCode) ? ' ' : '\n'),

charset = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/',

encodeCoordinates = coords => (coords.map(coord => {
      const 
      high = floor(coord / 64),
      low = coord % 64;
      return charset[high] + charset[low];
  }).join('')),

// Get the bounding box that accomodates the given images blobbiness.
calculateImageBoundingBox = image => {

  // let path;

  const components = image.components;

  if (arrayNotEmpty(components)) {

    tempCanvas.width = tempCanvas.width;

    // Render the image outline.
    for (let j = 0; j < components.length; j++) {

      const component = components[j];
      if (component.points.length > 2) { // Only render if it has at least 3 points.

        let 
        blobbiness = component.blobbiness,
        points = component.points.sort((a, b) => a.a - b.a).map(({x, y}) => [x * previewScale, y * previewScale]); // Sort in clockwise order, then map to an array.
  
        points.unshift(points[points.length - 1]); // Close.
        points.unshift(points[points.length - 2]);
        points.push(points[2]);
        points.push(points[3]);
  
        points = points.flat(); // Flatten.

        let last = points.length;

        tempContext.lineWidth = lineWidth * previewScale ;
        tempContext.strokeStyle = '#222';

        tempContext.beginPath();
        tempContext.moveTo(points[2],  points[3]);

        // path = 'M' + [ points[2],  points[3]]; // Begin path.
  
        for (let i = 2; i < last - 4; i += 2) {
          let 
          x1 = points[i],
          y1 = points[i + 1],
  
          x2 = points[i + 2],
          y2 = points[i + 3];

          tempContext.bezierCurveTo(x1 + ((x2 - (i ? points[i - 2] : points[0])) / 6) * blobbiness, y1 + ((y2 - (i ? points[i - 1] : points[1])) / 6) * blobbiness, x2 - (((i !== last ? points[i + 4] : x2) - x1) / 6) * blobbiness, y2 - (((i !== last ? points[i + 5] : y2) - y1) / 6) * blobbiness, x2, y2);

          // path += 'C' + [floor(x1 + ((x2 - (i ? points[i - 2] : points[0])) / 6) * blobbiness), 
          // floor(y1 + ((y2 - (i ? points[i - 1] : points[1])) / 6) * blobbiness), 
          // floor(x2 - (((i !== last ? points[i + 4] : x2) - x1) / 6) * blobbiness), 
          // floor(y2 - (((i !== last ? points[i + 5] : y2) - y1) / 6) * blobbiness), 
          // floor(x2), floor(y2)]; // Extend path.
        }
        tempContext.stroke();

        // Because this is just for measuring, don't bother to fill.

        // 
        // However, we still need to calculate the gradient variables.
        // 

        let 
        componentBounds = getBoundingBox(points),
        x0,
        y0,
        r1;
    
        if (componentBounds.w > componentBounds.h) {
          // Stretch the gradient horizontally.
          x0 = componentBounds.x + (componentBounds.w * .3);
          y0 = componentBounds.y + (componentBounds.h * .2);
          r1 = componentBounds.w * .9;
    
        } else {
          // Stretch the gradient vertically.
          x0 = componentBounds.x + (componentBounds.w * .2);
          y0 = componentBounds.y + (componentBounds.h * .3);
          r1 = componentBounds.h * .9;
        }
    
        // Save gradient params to component.
        component.x0 = floor(x0);
        component.y0 = floor(y0);
        component.r1 = floor(r1);
    
      }
    }

    let bounds = getContextBoundingBox(tempContext);

    if (bounds != undefined) {
      image.x = bounds.left;
      image.y = bounds.top;
      image.w = bounds.w;
      image.h = bounds.h;
    }

  } else {
    image.x = 0;
    image.y = 0;
    image.w = 0;
    image.h = 0;
  }
},

// Generate exported code and copy it to the system clipbpoard.
exportImages = e => {

  let 
  str,
  output = `blobbyImages = [${newLine()}`;

  // 
  // Generate images.
  // 

  for (let k = 0; k < dataFile.images.length; k++) {
    const 
    image = dataFile.images[k];

    calculateImageBoundingBox(image);

    const 
    dX = image.x,
    dY = image.y;


    if (image.components.length > 0) { // Skip images with no components.

      output += `${indentCode(1)}[`;
      output += (dataFile.generateComments && !dataFile.compactCode) ? ` // ${image.name}.${newLine()}` : newLine();

      const components = image.components.sort((a, b) => a.z - b.z); // Sort into drawing order.

      for (let i = 0; i < components.length; i++) {
        const component = components[i];

        if (component.points.length > 2) { // Skip components with no points.
          output += `${indentCode(2)}[`;
          output += (dataFile.generateComments && !dataFile.compactCode) ? ` // ${component.name}.${newLine()}` : newLine();

          let points = component.points.sort((a, b) => a.a - b.a).map(({x, y}) => [(x * previewScale) - dX, (y * previewScale) - dY]).flat();

          let encodedPoints = encodeCoordinates(points);
          
          log(points);

          str = '';

          // for (let j = 0; j < points.length; j++) str += `${points[j]}, `
          // output += `${indentCode(3)}${str.substring(0, str.length - 1)}`;

          output += `${indentCode(3)}'${encodedPoints}',`;

          output += (dataFile.generateComments && !dataFile.compactCode) ? ` // Points.${newLine()}` : newLine();
          
          // output += `${indentCode(3)}${component.x0 - dX},`;
          // output += (dataFile.generateComments && !dataFile.compactCode) ? ` // Gradient x.${newLine()}` : newLine();

          // output += `${indentCode(3)}${component.y0 - dY},`;
          // output += (dataFile.generateComments && !dataFile.compactCode) ? ` // Gradient y.${newLine()}` : newLine();

          // output += `${indentCode(3)}${component.r1},`;
          // output += (dataFile.generateComments && !dataFile.compactCode) ? ` // Gradient radius.${newLine()}` : newLine();

          output += `${indentCode(3)}${component.blobbiness},`;
          output += (dataFile.generateComments && !dataFile.compactCode) ? ` // Blobbiness.${newLine()}` : newLine();

          output += `${indentCode(3)}${component.palette}`;
          output += (dataFile.generateComments && !dataFile.compactCode) ? ` // Palette.${newLine()}` : newLine();
          
          output += `${indentCode(2)}],${newLine()}`;
        }
      }

      output += `${indentCode(2)}'${encodeCoordinates([image.w, image.h])}',`;
      output += (dataFile.generateComments && !dataFile.compactCode) ? ` // Dimensions.${newLine()}` : newLine();

      // output += `${indentCode(2)}${image.w},`;
      // output += (dataFile.generateComments && !dataFile.compactCode) ? ` // Width.${newLine()}` : newLine();
      // output += `${indentCode(2)}${image.h}`;
      // output += (dataFile.generateComments && !dataFile.compactCode) ? ` // Height.${newLine()}` : newLine();

      output += `${indentCode(1)}],${newLine()}`;

    }
  }

  // 
  // Generate palettes.
  // 

  output += `${indentCode(1)}${lineWidth * previewScale},`;
  output += (dataFile.generateComments && !dataFile.compactCode) ? ` // Line width.${newLine()}` : newLine();

  output += `${indentCode(1)}[`;
  output += (dataFile.generateComments && !dataFile.compactCode) ? ` // Palettes.${newLine()}` : newLine();

  str = '';

  for (let j = 0; j < dataFile.palettes.length; j++) {
    const parts = dataFile.palettes[j].split(',');

    str += indentCode(2);

    for (let i = 0; i < parts.length; i++) str += `'${parts[i]}', `;
    str += newLine();

  };
  output += str.substring(0, str.length - 3);

  output += `${newLine()}${indentCode(1)}],${newLine()}`;

  output = output.substring(0, output.length - 2);


  output += `${newLine()}];${newLine()}${newLine()}`; // Images close.

  if (dataFile.compactCode) output = output.replaceAll(' ', '');

  output = `let ${output}`;

  output = highlightSyntax(output);

  outputCode.innerHTML = output;

  writeClipboardText(outputCode);
};

// #endregion

// #region Syntax Highlighting

// A generator function to generate unique alpha strings.
function* uniqueIdentifierGenerator() {
  let 
  alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  length = 1,
  current = 0;

  while (true) {
    let 
    identifier = [],
    temp = current;

    for (let i = 0; i < length; i++) {
      identifier.unshift(alphabet[temp % alphabet.length]);
      temp = Math.floor(temp / alphabet.length);
    }

    yield identifier.join('');

    current++;
    if (current === Math.pow(alphabet.length, length)) {
      current = 0;
      length++;
    }
  }
}

const 
uidGenerator = uniqueIdentifierGenerator(),

getUID = e => (uidGenerator.next().value),

// Highlight the given syntax. NOTE: This is possibly the worlds worst syntax highlighter :D
highlightSyntax = str => {

  let 
  literalStringRegex = /(`[^`]*`)|(['"])(?:(?!\2)[^`\\]|\\.)*?\2/g,
  normalStrings = [],
  templateLiterals = [],
  literalStringMap = {},
  match;
  // Separate normalstrings and literal template strings.
  while ((match = literalStringRegex.exec(str)) !== null) {
    if (match[1]) {
      templateLiterals.push(match[1]);
    } else if (match[2]) {
      normalStrings.push(match[0]);
    }
  }

  // Recolor normal strings.
  for (let i = 0; i < normalStrings.length; i++) {
    const string = normalStrings[i];
    str = str.replace(string, `<span class="string">${string}</span>`);
  }

  // Split given literal template into it's constituent parts for recoloring.
  const 
  splitTemplateLiteral = literal => {
    literal = literal.slice(1, -1);
    const parts = literal.split(/(\$\{[^}]*\})/);
    parts[0] = `\`${parts[0]}`; // Insert backtick at beginning of first string.
    parts[parts.length - 1] = `${parts[parts.length - 1]}\``; // add backtick at end of last string.
    return parts.filter(part => part !== '');
  },

  // Add correct span tags to strings.
  addSpans = part => {
    if (part.startsWith('${')) {
      return `<span class="literal">\${</span><span class="keyword">${part.slice(2, -1)}</span><span class="literal">}</span>`;
    } else {
      return `<span class="string">${part}</span>`;
    }
  },

  // Split and add span tags to literal templates.
  processedTemplateLiterals = templateLiterals.map(literal => 
    splitTemplateLiteral(literal).map(addSpans)
  );

  // Add literals to an associative array and 
  for (let i = 0; i < processedTemplateLiterals.length; i++) {
    let 
    literal = processedTemplateLiterals[i],
    id = '$literal$' + getUID();

    str = str.replace(templateLiterals[i], id); // replace in main string with id for later reinsertion.
    literalStringMap[id] = literal.join('');
  }

  const 
  functionRegEx = /(\bfunction\s+(\w+)\b|\b(\w+)\s*=\s*(\(\s*[\w\s,]*\s*\)\s*|[\w\s,]*\s*)=>)/g,
  matches = str.matchAll(functionRegEx),
  functionNames = [];

  for (const match of matches) {

    if (match[2]) {
      functionNames.push(match[2]); // For regular functions
    } else if (match[3]) {
      functionNames.push(match[3]); // For arrow functions
    }
  }

  functionNames.forEach(functionName => {
    str = str.replace(new RegExp(functionName, 'gi'), `<span class="func">${functionName}</span>`);
  });

  // Recolor comments.
  const commentRegex = /(\/\/.*?$|\/\*[\s\S]*?\*\/)/gm;
  str = str.replace(commentRegex, '<span class="comment">$1</span>')

  // Recolor brackets.
  const bracketRegex = /[\[\]]/g;
  str = str.replace(bracketRegex, (match) => `<span class="bracket">${match}</span>`);

  // Recolor parenthesis.
  const parenthesisRegex = /[()]/g;
  str = str.replace(parenthesisRegex, (match) => `<span class="parenthesis">${match}</span>`);

  // Recolor curly braces.
  const curlyBraceRegex = /[{}]/g;
  str = str.replace(curlyBraceRegex, (match) => `<span class="curly-brace">${match}</span>`);

  // Recolor numbers.
  // const numberRegex = /\b\d+\b/g;
  const numberRegex = /(?<!['"])(\b\d+\b)(?!['"])/g;
  str = str.replace(numberRegex, (match) => `<span class="number">${match}</span>`);

  // Recolor keywords.
  const keywords = [
    'function', 
    'const',
    'let',
  ];

  const keywordRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g');
  str = str.replace(keywordRegex, '<span class="keyword">$1</span>');

  // Recolor lengths.
  const lengthRegex = /\b(\w+)(\.length)\b/g;
  str = str.replace(lengthRegex, '$1<span class="length">$2</span>');

  // Recolor semicolons.
  const semicolonRegEx = /;/g;
  str = str.replace(semicolonRegEx, '<span class="semicolon">$&</span>');

  // Recolor semicolons.
  const commaRegEx = /,/g;
  str = str.replace(commaRegEx, '<span class="semicolon">$&</span>');

  // Recolor arrow functions.
  const arrowFunctionRegex = /=>/g;
  str = str.replace(arrowFunctionRegex, '<span class="arrow-function">$&</span>');

  // Reinsert the formatted literal templates in their correct positions.
  const entries = Object.entries(literalStringMap);
  entries.forEach(([key, value]) => {
      str = str.replace(key, value);//`\`${value}\``);
      // console.log(`${key}: ${value}`);
  });

  // Recolor function names. Do this after reintegrating the literal strings because they might contain one of these functions.
  const functionNames2 = [
    'btoa',
  ];

  const functionNamesRegex = new RegExp(`\\b(${functionNames2.join('|')})\\b`, 'g');
  str = str.replace(functionNamesRegex, '<span class="func">$1</span>');

  // Replace newlines with line breaks.
  str = str.replace(/\r?\n/g, '<br>');

  return str;
};


// #endregion

// #region Window Event Handlers

// Process window key up events.
onkeyup = e => {

  // log(e.code);

  switch (e.code) {

    case 'F2':
      showHelp(!helpVisible); // Toggle visibility.
      e.stopImmediatePropagation();
      break;

    case 'Enter':
    case 'Escape':
      if (helpVisible) {

        // Close help dialog.

        showHelp(false);
        e.stopImmediatePropagation();

      } else if (colorPickerOpen) {

        // Close the color picker.

        showElement(colorPicker, false);

        colorPickerOpen = false;
        e.stopImmediatePropagation();
      
      } else if (downloadSelectVisible) {

        // Close download select dialog and download images if required.

        showElement(downloadSelect, false);

        downloadSelectVisible = false;
        e.stopImmediatePropagation();

        if (e.code === 'Enter') downloadImages();
      }

      break;

    default:
      break;
  }
};

// Process window key down events.
onkeydown = e => {

  if (helpVisible || anInputIsActive) return;

  // log(e.code);

  switch (e.code) {

    case 'Backquote':

      if (e.ctrlKey) {
        if (!selectedImage) {
          if (dataFile.images.length > 0) cycleThroughButtonsInArray(dataFile.images[0], dataFile.images, imageButtonContainer);

        } else {

          cycleThroughButtonsInArray(selectedImage, dataFile.images, imageButtonContainer);
        }

        e.stopImmediatePropagation();

      } else if (e.altKey) {
        if (!selectedComponent) {
          if (selectedImage.components.length > 0) cycleThroughButtonsInArray(selectedImage.components[selectedImage.components.length - 1], selectedImage.components, componentButtonContainer);

        } else {
          cycleThroughButtonsInArray(selectedComponent, selectedImage.components, componentButtonContainer);
        }
        e.stopImmediatePropagation();
  
      } else {
        if (selectedPoint) {
          cycleThroughButtonsInArray(selectedPoint, selectedComponent.points, pointButtonContainer, (e.shiftKey)? -1 : 1);
          e.stopImmediatePropagation();
        }
      }
      break;

    case 'Delete':
      if (anInputIsActive) break;

      if (e.ctrlKey) {
        deleteImage();
        e.stopImmediatePropagation();

      } else if (e.shiftKey) {
        deleteComponent();
        e.stopImmediatePropagation();

      } else {
        if (selectedPoint) {
          deletePoint();
          setElementPosition(dotSelect, -50, -50);
          e.stopImmediatePropagation();
        }  
      }
      break;
  
    case 'ArrowLeft':
      moveMultiplePoints(-2, 0, e.shiftKey, e.ctrlKey);
      e.stopImmediatePropagation();
      break;

    case 'ArrowRight':
      moveMultiplePoints(2, 0, e.shiftKey, e.ctrlKey);
      e.stopImmediatePropagation();
      break;

    case 'ArrowUp':
      moveMultiplePoints(0, -2, e.shiftKey, e.ctrlKey);
      e.stopImmediatePropagation();
      break;

    case 'ArrowDown':
      moveMultiplePoints(0, 2, e.shiftKey, e.ctrlKey);
      e.stopImmediatePropagation();
      break;

    default:
      break;
  }

};

// If any dialog is open, close it if the user clicks outside of it's bounding box.
onpointerup = e => {

  if (colorPickerOpen) {
    const bounds = colorPickerDialog.getBoundingClientRect();
    if (e.pageX < bounds.left || e.pageX > bounds.right || e.pageY < bounds.top || e.pageY > bounds.bottom ) {
      showElement(colorPicker, false);
      colorPickerOpen = false;
      e.preventDefault();
    }

  } else if (downloadSelectVisible) {
    const bounds = downloadSelectBody.getBoundingClientRect();
    if (e.pageX < bounds.left || e.pageX > bounds.right || e.pageY < bounds.top || e.pageY > bounds.bottom ) {
      showElement(downloadSelect, false);
      downloadSelectVisible = false;
      e.preventDefault();
    }

  } else if (helpVisible) {
    if (e.button != 0) return;
    const 
    x = e.pageX,
    y = e.pageY,
    bounds = helpBody.getBoundingClientRect();
    if (x < bounds.left || x > bounds.right || y < bounds.top || y > bounds.bottom) showHelp(false);
      e.preventDefault();
  }

};

// #endregion

// #region Window onLoad

// Window onload event handler, fired when entire web page has loaded.
onload = e => {

  editorBounds = editorCanvas.getBoundingClientRect();

  dataFile = loadDataFile(); // Load images.

  (!dataFile) ? resetDataFile() : dataFile = JSON.parse(dataFile); // Parse or reset.

  initImageArray();

  initPalettes();

  // Install event handlers.
  editorCanvas.onpointermove = editorPointerMoveHandler;
  editorCanvas.onpointerup = editorPointerUpHandler;
  editorCanvas.onpointerdown = editorPointerDownHandler;

  // Initialize export controls.
  generateCommentsCheckbox.checked = dataFile.generateComments;
  indentCodeCheckbox.checked = dataFile.indentCode;
  indentSizeInput.value = dataFile.indentSize;
  compactCodeCheckbox.checked = dataFile.compactCode;

  // Disable controls.
  imageNameInput.disabled = true;

  deleteImageButton.disabled = true;
  saveImagesButton.disabled = (dataFile.images.length > 0) ? false : true;
  downloadImagesButton.disabled = (dataFile.images.length > 0) ? false : true;

  duplicateImageButton.disabled = true;
  flipImageXButton.disabled = true;
  flipImageYButton.disabled = true;

  componentNameInput.disabled = true;

  componentBlobbinessRange.disabled = true;
  componentBlobbinessInput.disabled = true;

  addComponentButton.disabled = true;
  deleteComponentButton.disabled = true;

  componentZIndexRange.disabled = true;
  componentZIndexInput.disabled = true;

  flipComponentXButton.disabled = true;
  flipComponentYButton.disabled = true;

  paletteContainer.disabled = true;
  openColorPickerButton.disabled = true;

  deletePointButton.disabled = true;
  clearPointsButton.disabled = true;
  pointXInput.disabled = true;
  pointYInput.disabled = true;

  duplicateComponentButton.disabled = true;

  enablePaletteSwatches(false);

  // Set event handler to inform the user that some data may be unsaved.
  window.onbeforeunload = e => {
    if (unsavedChanges) {
      e.preventDefault();
      e.returnValue = true;
    }
  };

  const codeSnippet = `
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
    charset = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVW&lt&gtZ+/',
    coords = [];
    for (let i = 0; i < sizeOf(encoded); i += 2) coords.push(charset.indexOf(encoded[i]) * 64 + charset.indexOf(encoded[i + 1]));
    return coords;
  },

  image = blobbyImages[index],

  imageToRenderSize = sizeOf(image),

  blobbyImagesSize = sizeOf(blobbyImages),

  palettes = blobbyImages[blobbyImagesSize - 1],

  [imageWidth, imageHeight] = decodeCoordinates(image[imageToRenderSize - 1]),

  svgString = \`&ltsvg viewBox="0 0 \${imageWidth} \${imageHeight}" width="\${imageWidth}" height="\${imageHeight}" xmlns="http://www.w3.org/2000/svg"&gt&ltdefs&gt\`,

  xxxString = 'what the fuck',

  pathsString = '',

  svgColorStop = (offset, color) => svgString += \`&ltstop offset="\${offset}" stop-color="#\${color}"/&gt\`,

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
    svgString += \`&ltradialGradient id="g\${gradientID}" r="90%" cx="30%" cy="30%"&gt\`;
    svgColorStop(0, palettes[paletteIndex ++]);
    svgColorStop(.2, palettes[paletteIndex ++]);
    svgColorStop(.6, palettes[paletteIndex ++]);
    svgString += \`&lt/radialGradient>\`;

    // Append component path.
    pathsString += \`&ltpath d="\${path}" stroke="#000" stroke-width="\${blobbyImages[blobbyImagesSize - 2]}" fill="url(#g\${gradientID++})"/&gt\`;
  }

  // Execute this code when the image has fully loaded.
  img.onload = () => {
    // Do whatever with the image now.
    imageContainer.appendChild(img); // Example displays it in an HTML div.
  }

  img.src = \`data:image/svg+xml;base64,\${btoa(svgString + '&lt/defs&gt' + pathsString + '&lt/svg&gt')}\`; // Mime encode SVG and set it to the images source (start it loading).
};

// Execute this code when the page has fully loaded.
onload = e => {
  for (let i = 0; i < blobbyImages.length - 2; i++) renderBlobbyImage(i);
};
`;

  // Highlight and set the blobby renderer code.
  blobbyRenderCode.innerHTML = highlightSyntax(codeSnippet.replace(/\\`/g, '`'));

  // Render preview pane background imagery.
  const 
  previewBackgroundContext = previewBackgroundCanvas.getContext('2d'),
  previewBackgroundGradient = previewBackgroundContext.createRadialGradient(256, 256, 1, 256, 256, 256);
  previewBackgroundCanvas.width = 512;
  previewBackgroundCanvas.height = 512;
  previewBackgroundGradient.addColorStop(0, '#777');
  previewBackgroundGradient.addColorStop(1, '#555');
  previewBackgroundContext.fillStyle = previewBackgroundGradient;
  previewBackgroundContext.fillRect(0, 0, 512, 512);

  previewContext.drawImage(previewBackgroundCanvas, 0, 0); // Draw to preview panel.

  // Render editor pane background imagery.
  const 
  editorBackgroundContext = editorBackgroundCanvas.getContext('2d');
  editorBackgroundCanvas.width = 512;
  editorBackgroundCanvas.height = 512;

  editorBackgroundContext.fillStyle = '#555';
  editorBackgroundContext.fillRect(0, 0, 512, 512);

  editorBackgroundContext.lineWidth = 1;
  editorBackgroundContext.setLineDash([1, 7]);
  editorBackgroundContext.beginPath();
  editorBackgroundContext.strokeStyle = '#000';
  for (let x = 0; x < 512; x += 8) {
    editorBackgroundContext.moveTo(x + 0, 0);
    editorBackgroundContext.lineTo(x + 0, 512);
  }
  editorBackgroundContext.stroke();

  editorBackgroundContext.setLineDash([3, 5]);
  editorBackgroundContext.strokeStyle = '#888';
  editorBackgroundContext.beginPath();
  for (let x = 0; x < 512; x += 128) {
    editorBackgroundContext.moveTo(x + .5, 0);
    editorBackgroundContext.lineTo(x + .5, 512);
    editorBackgroundContext.moveTo(.5, x + .5);
    editorBackgroundContext.lineTo(512, x + .5);
  }
  editorBackgroundContext.stroke();

  editorContext.drawImage(editorBackgroundCanvas, 0, 0); // Draw to editor panel.

  notify('Welcome to the blobby image editor. Press F2 for help', 4000);

};

// #endregion
