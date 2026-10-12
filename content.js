// Immediately Invoked Function Expression (IIFE)
// prevent the variables from conflicting with webpage's variables by doing this
(() => {
    // listen for a request to show the hidden popup
    chrome.runtime.onMessage.addListener((message) => {
        // check if the message action is to show the contrast assistant panel
        if (message.action === "showPanel") {
            // locate the existing contrast assistant panel in the DOM
            const panel = document.getElementById(
                "contrast-assistant-panel"
            );

            // if the panel exists, display it again
            if (panel) {
                panel.style.display = "block";
            }
        }
    });

    // remove an old notification if the extension is run again
    document.getElementById("contrast-assistant-panel")?.remove();

    // according to the WCAG guidelines, the minimum contrast ratio for normal text is 4.5:1
    const THRESHOLD = 4.5;

    // elements we will check in this small prototype
    const elements = document.querySelectorAll(
        "p, span, a, button, label, li, h1, h2, h3, h4, h5, h6"
    );

    // array to store elements with low contrast issues
    const issues = [];

    // converts CSS color string into individual numerical color values
    // e.g. "rgb(255, 255, 255)" becomes ["255", "255", "255"]
    function parseColor(color) {
        // utilize regex (regular expression) here
        // the slashes indicate the beginning and end of the regex
        // [\d.] matches a digit (0-9) or a decimal point
        // + means matching one or more characters
        // g means to find all matches
        const numbers = color.match(/[\d.]+/g);

        // RGB color should have at least 3 components (red, green, blue)
        if (!numbers || numbers.length < 3) {
            return null;
        }

        // return JS object containing these 4 properties
        // CSS also supports RGBA format where A is Alpha for transparency
        // a is for transparency, ranging from 0 (fully transparent) to 1 (fully opaque)
        // transparency isn't part of the scope, but it's necessary to know for other functions to work
        return {
            r: Number(numbers[0]),
            g: Number(numbers[1]),
            b: Number(numbers[2]),
            a: numbers.length >= 4 ? Number(numbers[3]) : 1
        };
    }

    // determine background color behind an element's text
    function getBackgroundColor(element) {
        // store the current element being checked
        let current = element;

        while (current) {
            // retrieve the CSS properties that the browser has for that element
            // including styles defined in stylesheets
            const style = getComputedStyle(current);

            // complex image/gradient backgrounds are outside prototype scope, so ignore for now
            if (style.backgroundImage !== "none") {
                return null;
            }

            // retrieve background color and pass it to parseColor function
            const color = parseColor(style.backgroundColor);

            // if a valid color is found, check its transparency
            if (color) {
                // fully solid background found
                if (color.a === 1) {
                    return color;
                }

                // partially transparent backgrounds are outside prototype scope
                if (color.a > 0 && color.a < 1) {
                    return null;
                }
            }

            // fully transparent background
            // look at parent element, as the actual visible background belongs to them
            current = current.parentElement;
        }

        // safety net for this prototype in case nothing is returned beforehand
        return { r: 255, g: 255, b: 255, a: 1 };
    }

    // calculate how bright a color is (according to WCAG)
    function relativeLuminance(color) {
        // create array of red, green, blue values
        // transform each value using the formula specified by WCAG for relative luminance
        const values = [color.r, color.g, color.b].map((value) => {
            // since RGB range is 0-255, divide by 255 to get range to 0-1
            const channel = value / 255;

            return channel <= 0.04045
                ? channel / 12.92
                : Math.pow((channel + 0.055) / 1.055, 2.4);
        });

        return (
            0.2126 * values[0] +
            0.7152 * values[1] +
            0.0722 * values[2]
        );
    }

    // checking contrast ratio between two colors
    // utilize formula specified by WCAG for contrast ratio between two colors
    function contrastRatio(color1, color2) {
        const luminance1 = relativeLuminance(color1);
        const luminance2 = relativeLuminance(color2);

        const lighter = Math.max(luminance1, luminance2);
        const darker = Math.min(luminance1, luminance2);

        return (lighter + 0.05) / (darker + 0.05);
    }

    // check if an element is visible on the page
    function isVisible(element) {
        const style = getComputedStyle(element);

        // purpose is to avoid checking hidden elements invisible to user
        // getBoundingClientRect retrieves the size and position of an element
        return (
            style.display !== "none" &&                     // element isn't hidden using display: none
            style.visibility !== "hidden" &&                // element isn't hidden using visibility: hidden   
            Number(style.opacity) !== 0 &&                  // element isn't fully transparent
            element.getBoundingClientRect().width > 0 &&    // element has positive width
            element.getBoundingClientRect().height > 0      // element has positive height
        );
    }

    // scanning each element for low-contrast text
    elements.forEach((element) => {
        // if not visible, skip this element
        if (!isVisible(element)) return;

        // retrieve the text content of the element
        const text = element.textContent.trim();

        // if the element has no text content, skip it
        if (!text) return;

        const style = getComputedStyle(element);
        const textColor = parseColor(style.color);
        const backgroundColor = getBackgroundColor(element);

        // if either the text color or background color couldn't be determined, skip this element
        if (!textColor || !backgroundColor) return;

        // transparent text is outside this prototype's scope
        if (textColor.a !== 1) return;
        
        // calculate contrast ratio
        const ratio = contrastRatio(textColor, backgroundColor);

        // if ratio is below threshold, NOTIFY!!!
        // push the element into the issues array and store its element, background color, and ratio
        if (ratio < THRESHOLD) {
            issues.push({
                element,
                backgroundColor,
                ratio
            });
        }
    });

    // if no low-contrast text issues were found, don't notify the user
    if (issues.length === 0) {
        console.log("Contrast Assistant: No low-contrast text detected.");
        return;
    }

    // otherwise, show the panel with low-contrast issues
    showPanel(
        "Low-contrast content detected",
        `${issues.length} text element(s) may fall below the 4.5:1 contrast threshold.`,
        true
    );


    function applyImprovedContrast() {
        // loop through every detected issue (object destructuring)
        issues.forEach(({ element, backgroundColor }) => {
            // save element original info for reversal later
            // save the element's existing inline color and inline color priority
            element.dataset.contrastAssistantOriginalColor =
                element.style.getPropertyValue("color");

            element.dataset.contrastAssistantOriginalPriority =
                element.style.getPropertyPriority("color");

            const black = { r: 0, g: 0, b: 0 };
            const white = { r: 255, g: 255, b: 255 };

            // create RGB representations of black and white
            const blackRatio = contrastRatio(black, backgroundColor);
            const whiteRatio = contrastRatio(white, backgroundColor);

            // calculate how readable black and white will be against current background
            // pick the color (black or white) that provides better contrast
            const betterColor =
                blackRatio >= whiteRatio ? "#000000" : "#ffffff";

            // apply the chosen color to the element
            // important priority overrides conflicting styling
            element.style.setProperty("color", betterColor, "important");
        });
    }

    function restoreOriginalContrast() {
        // loop through every detected issue and restore its original color and priority
        issues.forEach(({ element }) => {
            // retrieve the element's original color and priority from previously saved dataset
            const originalColor =
                element.dataset.contrastAssistantOriginalColor;

            const originalPriority =
                element.dataset.contrastAssistantOriginalPriority;

            // only restore the color if an original color was saved
            if (originalColor) {
                element.style.setProperty(
                    "color",
                    originalColor,
                    originalPriority || ""      // use an empty string if no original priority was saved
                );
            } else {
                element.style.removeProperty("color");
            }

            // remove the temporarily saved data
            // the reason why prototype won't remember previously visited website alterations
            delete element.dataset.contrastAssistantOriginalColor;
            delete element.dataset.contrastAssistantOriginalPriority;
        });
    }

    // creating the pop-up panel on the screen
    // allowChanges indicates whether the user can toggle contrast improvements
    function showPanel(title, message, allowChanges) {
        // create a new HTML div element to serve as the pop-up panel
        const panel = document.createElement("div");
        // set ID for panel for easy identification and removal of panel later
        panel.id = "contrast-assistant-panel";

        // apply initial styles to the panel for proper positioning and appearance
        Object.assign(panel.style, {
            position: "fixed",
            top: "20px",
            right: "20px",
            width: "320px",
            padding: "18px",
            background: "#ffffff",
            color: "#111111",
            border: "2px solid #222222",
            borderRadius: "10px",
            fontFamily: "Arial, sans-serif",
            fontSize: "14px",
            lineHeight: "1.4",
            zIndex: "2147483647",
            boxShadow: "0 4px 14px rgba(0,0,0,0.2)"
        });

        // create another HTML element for the heading text
        const heading = document.createElement("strong");
        heading.textContent = title;
        heading.style.display = "block";
        heading.style.marginBottom = "8px";

        // create another HTML element for the description text
        const description = document.createElement("p");
        description.textContent = message;
        description.style.margin = "0 0 12px";

        // append the heading and description elements to the panel
        panel.appendChild(heading);
        panel.appendChild(description);

        if (allowChanges) {
            // create a button to toggle contrast improvements
            const toggleButton = document.createElement("button");
            toggleButton.textContent = "Improve contrast";

            // to signify that the page hasn't been improved yet
            let improved = false;

            // when button is clicked, improve or restore contrast based on current state
            toggleButton.addEventListener("click", () => {
                if (!improved) {
                    applyImprovedContrast();
                    toggleButton.textContent = "Restore original";
                    improved = true;
                } else {
                    restoreOriginalContrast();
                    toggleButton.textContent = "Improve contrast";
                    improved = false;
                }
            });

            // apply consistent styling to the toggle button
            styleButton(toggleButton);
            panel.appendChild(toggleButton);
        }

        // Create a button to temporarily hide the popup
        const hideButton = document.createElement("button");
        hideButton.textContent = "Hide";

        // Hide the popup without removing it from the webpage
        hideButton.addEventListener("click", () => {
            panel.style.display = "none";
        });

        // Apply the same styling as the other button
        styleButton(hideButton);
        hideButton.style.marginLeft = "8px";

        // Add the Hide button to the popup
        panel.appendChild(hideButton);

        // Display the popup on the webpage
        document.body.appendChild(panel);
    }

    // function to apply consistent styling to buttons
    function styleButton(button) {
        Object.assign(button.style, {
            padding: "8px 12px",
            cursor: "pointer",
            border: "1px solid #444444",
            borderRadius: "6px",
            background: "#f5f5f5",
            color: "#111111"
        });
    }
})();