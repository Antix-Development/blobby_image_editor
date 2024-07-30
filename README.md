
<h1>Blobby Image Editor</h1><br>

A basic tool for creating and editing 2d blobby images which can be used as assets in web apps and games.

<h2>Whats New?</h2>

v1.0.0-rc.1 (30 Jul 2024)

- Component points now encoded to ASCII string to reduce exported code size. Thanks to [xem](https://github.com/xem) for suggesting it.

- Image dimensions also encoded into an ASCII string.

- Viewer now generates SVG image. Thanks again to [xem](https://github.com/xem) for suggesting it.

- Viewer code grew in size but offset by size savings in exported code.

- Help dialog improved layout and also now mirrors readme.md.

- Major overhaul of the syntax highlighting so it can handle literal template strings.

<h2>History</h2>

<details><summary>v0.9.0 (28 Jul 2024)</summary><p>

- Initial public release

</p></details>

<h2>Getting Started</h2>

<ol>
  <li>Click the <b><i>New Image</i></b> button to create a new blobby image.<br></li>
  <li>Click the <b><i>New Component</i></b> button to add a new component to the selected blobby image.<br></li>
  <li>Click anywhere in the editor pane to add points to the selected component.<br></li>
  <li>Create and manipulate more components and blobby images.<br></li>
  <li>Export and use the blobby images inside your game.<br></li>
</ol>

<h2>Selecting Things</h2>

<ul>
  <li><b><i>Left</i></b> click a point in the editor pane to select it.<br></li>
  <li><b><i>Right</i></b> click a component in the editor pane to select it.<br></li>
  <li>Press the <b><i>Tilde</i></b> key to select the next point in the selected component.</li>
  <li>Hold the <b><i>Shift</i></b> key and press the <b><i>Tilde</i></b> key to select the previous point in the selected component.</li>
<li>Hold the <b><i>Alt</i></b> key and press the <b><i>Tilde</i></b> key to cycle through the components in the selected blobby image.</li>
    <li>Hold the <b><i>Ctrl</i></b> key and press the <b><i>Tilde</i></b> key to cycle through the blobby images.</li>
</ul>

<h2>Moving Things</h2>

<ul>
  <li><b><i>Left</i></b> click and hold points from the selected component in the editor pane, and drag them about.</li>
  <li>Use <b><i>Arrow</i></b> keys to move the selected point.</li>
  <li>Hold <b><i>Shift</i></b> and press <b><i>Arrow</i></b> keys to move the selected component.</li>
  <li>Hold <b><i>Ctrl</i></b> and press <b><i>Arrow</i></b> keys to move the selected blobby image.</li>
</ul>

<h2>Deleting Things</h2>

<ul>
  <li>Press the <b><i>Delete</i></b> key to delete the selected point.</li>
  <li>Hold <b><i>Shift</i></b> and press the <b><i>Delete</i></b> key to delete the selected component.</li>
  <li>Hold <b><i>Ctrl</i></b> and press the <b><i>Delete</i></b> key to delete the selected blobby image.</li>
</ul>

<h2>Components</h2>

<ul>
  <li>Use the <b><i>Blobbiness</i></b> slider to change the blobbiness of the selected component.</li>
  <li>Use the <b><i>Z-Index</i></b> slider to change the selected components draw order.</li>
  <li>You can <b><i>Double-Click</i></b> a palette to modify its colors.</li>
  <li>The other controls in this pane should be self explanatory..</li>
</ul>

<h2>Uploading and Downloading Images</h2>

<ul>
  <li>Click the <b><i>Download Images</i></b> button to open a dialog where you can select images to download.</li>
  <li>Click the <b><i>Upload Images</i></b> button to upload previously downloaded images..</li>
</ul>

<h2>Exporting Images</h2>

<ul>
  <li>Click the <b><i>Export Images</i></b> button to generate JavaScript code describing the images, and copy it to the clipboard.</li>
  <li>Fiddle with the other controls to modify the format of the generated code.</li>
  <li>You can also drag the names around in the blobby image list to change the order in which the are exported.</li>
  <li><b><i>Note</i></b> Exported images will be clipped to their bounding boxes.</li>
  <li><b><i>Note</i></b> Exported images will be scaled according to the selected scale in the preview panel.</li>
</ul>

The exported data will be in the form of an array named <b><i>blobbyImages</i></b>, which contains the following data...

<table>
  <caption>blobbyImages</caption>
  <tbody>
    <tr class="emphasize">
      <td>Index</td>
      <td>Type</td>
      <td>Description</td>
    </tr>
    <tr>
      <td>0</td>
      <td>array</td>
      <td><b><i>ImageDefs</i></b>.</td>
    </tr>
    <tr>
      <td>length - 2</td>
      <td>number</td>
      <td>Line width used when rendering.</td>
    </tr>
    <tr>
      <td>length - 1</td>
      <td>array</td>
      <td>Palette strings, eight sets of 3 in total.</td>
    </tr>

  </tbody>
</table>

<table>
  <caption>ImageDef</caption>
  <tbody>
    <tr class="emphasize">
      <td>Index</td>
      <td>Type</td>
      <td>Description</td>
    </tr>
    <tr>
      <td>0</td>
      <td>array</td>
      <td><b><i>Components</i></b>, sorted into ascending z-index order.</td>
    </tr>
    <tr>
      <td>length - 1</td>
      <td>encoded array</td>
      <td>Image width and height.</td>
    </tr>
  </tbody>
</table>

<table>
  <caption>Component</caption>
  <tbody>
    <tr class="emphasize">
      <td>Index</td>
      <td>Type</td>
      <td>Description</td>
    </tr>
    <tr>
      <td>0</td>
      <td>encoded array</td>
      <td><b><i>Points</i></b>, sorted into clockwise order.</td>
    </tr>
    <tr>
      <td>length - 2</td>
      <td>number</td>
      <td>Blobbiness.</td>
    </tr>
    <tr>
      <td>length - 1</td>
      <td>number</td>
      <td>Palette.</td>
    </tr>
  </tbody>
</table>
<br>

<h2>Export Caveats</h2>
<ul>
  <li>Component coordinates are encoded as whole numbers between 0 and 511. Because scaled output can result in floating point numbers, these coordinates will be rounded to the nearest whole number. To avoid image distortion, align your points with coordinates that will not result in floating point numbers.</li>
</ul>

<h2>Miscellaneous</h2>

<ul>
  <li>Everything that moves does so in 2 pixel increments to avoid floating point numbers.</li>
  <li>All blobby images are stored in your web browsers `<i>localStorage</i>`.</li>
  <li>Currently there is no <i>UNDO</i> functionality.</li>
  <li>Seems to work in Chrome and FireFox, </li>
</ul>
<br>

Blobby image editor is a tool created for JS13K 2024 by Cliff Earl, Antix Development.

<h2>Thanks</h2>

If you end up using Blobby Image Editor maybe you'd consider [buying me a coffee](https://www.buymeacoffee.com/antixdevelu) :coffee:
