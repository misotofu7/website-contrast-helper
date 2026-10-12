# Contrast Assistant
**BananaBots Onboarding Project**

## About

I first became interested in exploring the WCAG guidelines after noticing how difficult low-contrast text can be to read, whether on websites or even in class presentations. As someone without vision issues, it made me think about how much harder these situations could be for people with vision-related difficulties.

For this project, I wanted to see whether a browser extension could be implemented to address this issue.

Contrast Assistant is a Chrome extension prototype that detects potentially difficult-to-read text based on WCAG color-contrast guidelines and offers the user an option to improve the contrast of the detected elements. The goal is to make the tool simple, user-controlled, and reversible without changing the entire website's appearance.

## Features

- Automatically scans supported webpages for potential low-contrast text when the page loads
- Identifies foreground and background colors of selected text elements
- Calculates contrast ratios using the formula provided by WCAG
- Notifies users through a small pop-up when potential contrast issues are found and specifies how many
- Allows users to improve the contrast of detected text by applying either black or white, depending on which provides a higher contrast ratio
- Allows users to restore the original text colors through a toggle button
- Gives users the option to hide the notification without making changes

## How It Works

1. When the user visits a webpage, the extension automatically runs its content script.
2. The extension looks through selected HTML elements containing text, such as paragraphs, headings, links, and buttons.
3. For each element, JavaScript attempts to retrieve its foreground and background colors using `getComputedStyle()`.
4. The RGB color values are converted into relative luminance values using the formula provided by the W3C.
5. The contrast ratio is calculated using:

   **Contrast Ratio = (L1 + 0.05) / (L2 + 0.05)**

   - L1 is the relative luminance of the lighter color.
   - L2 is the relative luminance of the darker color.

6. The calculated ratio is compared against the WCAG minimum threshold of 4.5:1 for normal text.
7. If the contrast falls below the threshold, the element is marked as a potential contrast issue.
8. If issues are found, the user receives a small notification at the top right corner of the webpage.
9. The user may choose to improve the contrast or hide the suggestion.
10. If the user chooses to improve the contrast, the extension applies either black or white text, depending on which provides better contrast against the background.
11. The user may restore the original text colors by toggling off the improvement.

## Technical Implementation

The prototype is built using JavaScript, HTML, CSS, and the Chrome Extensions API (Manifest V3).

The main files are:

- `manifest.json` — Defines the extension's configuration and allows the content script to run automatically on supported webpages.
- `content.js` — Contains the main logic for detecting low-contrast text, calculating contrast ratios, displaying notifications, and applying or reversing changes.
- `background.js` — Listens for clicks on the Chrome extension icon and sends a message to content.js to reopen the hidden notification.
- HTML testing page — Contains sample text elements with known foreground and background color combinations to test the prototype.

JavaScript interacts with the webpage through the DOM (Document Object Model). The `getComputedStyle()` method is used to retrieve resolved CSS values for text and background colors.

For elements with fully transparent backgrounds, the prototype attempts to find a solid background color by looking through the element's parent elements.

The original inline text colors and CSS priorities are saved using the HTML element's `dataset` property before applying the contrast changes. This allows users to restore the previous inline styling without requiring a backend or database.

## Installation and Testing

1. Download or clone this repository.
2. Open Google Chrome and navigate to `chrome://extensions`.
3. Enable Developer Mode.
4. Click **Load unpacked** and select the folder containing `manifest.json`.
5. Open or refresh a supported webpage.
6. If low-contrast text is detected, the extension should automatically display a notification.

For testing with a local HTML file, file URL matching must be configured in the manifest, and **Allow access to file URLs** must be enabled in the extension's settings.

### Test Cases

I first tested the prototype on a simple HTML page containing known color combinations before attempting to use it on more complex websites.

The test cases include:

- Dark gray text on a white background → No notification for that element
- Light gray text on a white background → Detect low contrast
- Dark gray text on a dark background → Detect low contrast
- Low-contrast hyperlink → Detect low contrast
- Low-contrast button text → Detect low contrast
- Clicking Improve Contrast → Apply a higher-contrast text color
- Clicking Restore Original → Restore the original inline styling
- Clicking hide → Hide the notification
- Clicking extension icon → Popup reappears

## Prototype Scope and Limitations

The main focus of this prototype is to demonstrate the concept of detecting low-contrast text and providing reversible improvements. It is not intended to guarantee WCAG compliance across every website.

The prototype currently does not attempt to:

- Detect every type of accessibility issue
- Accurately analyze text displayed over images, gradients, or partially transparent backgrounds
- Account for all complex background layers or overlapping elements
- Continuously scan for changes made after the initial webpage load
- Fully account for different WCAG requirements for large text, decorative content, or other exceptions
- Preserve the exact original website color scheme when applying improvements
- Guarantee accurate results for every website
- Support browsers other than Google Chrome

Some text elements may also be checked more than once when nested HTML elements contain the same text.

For simplicity, the prototype currently uses a fixed 4.5:1 threshold and chooses between black and white when improving contrast.

## Reflection / What I Learned

Initially, I thought that detecting contrast issues would be relatively simple, mainly by comparing the foreground and background colors of text elements. However, after researching how websites actually render colors, I realized that determining the visible background can be much more complicated.

For example, some text elements have transparent backgrounds, meaning that their actual background color may come from a parent element. Other websites use gradients, images, layered backgrounds, or dynamic styling that make it difficult to determine the exact colors behind text.

Because of this, I decided to limit the scope of the prototype to situations where the foreground and background colors can be determined more reliably.

Another challenge was deciding how the extension should improve the contrast without changing too much of the website's original appearance. For this prototype, I chose to use black or white text because it provides a simpler way to demonstrate the improvement functionality, although this does not always preserve the website's original design.

I also wanted to make sure that users would have control over whether changes were applied. Instead of automatically modifying every detected element, the extension first notifies the user and allows them to choose whether to improve the contrast. Any applied changes can then be reversed.

Working on this project helped me better understand how browser extensions interact with webpages, how CSS properties are retrieved through JavaScript, and how accessibility guidelines can be applied in a working software prototype.

## Future Plans

Some possible improvements I would like to explore include:

- Improving contrast detection for more complex backgrounds, including gradients, transparency, and images
- Detecting changes in webpage content after the initial scan
- Supporting different WCAG contrast requirements depending on text size
- Improving the choice of adjusted colors so that the original website design is preserved as much as possible
- Allowing users to save their preferences or previous corrections for specific websites
- Expanding the extension to other browsers, such as Firefox, Edge, and Safari
- Exploring other accessibility issues, such as text size, spacing, and images missing alternative text

## Research Sources

- [W3C — Web Content Accessibility Guidelines](https://www.w3.org/WAI/standards-guidelines/wcag/)
- [WCAG 2.2 — Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- [W3C — Relative Luminance](https://www.w3.org/TR/WCAG21/relative-luminance.html)
- [National Eye Institute — Low Vision](https://www.nei.nih.gov/eye-health-information/eye-conditions-and-diseases/low-vision)
- [MDN — getComputedStyle()](https://developer.mozilla.org/en-US/docs/Web/API/Window/getComputedStyle)
- [Chrome Developers — Content Scripts](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts)
- [Chrome Developers — Manifest V3](https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3)

## Project Status

Initial Chrome extension prototype (v0.1.0).

The current implementation focuses on detecting potential low-contrast text, notifying users of identified issues, and demonstrating user-controlled, reversible contrast improvements.