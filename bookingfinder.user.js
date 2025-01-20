// ==UserScript==
// @name         Service NSW Earliest Booking Finder
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Find earliest available booking date with configurable refresh and push notifications
// @author       why7e
// @match        https://www.myrta.com/wps/portal/extvp/myrta/licence/tbs/tbs-change-main/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM.notification
// @grant        window.focus
// ==/UserScript==

(function() {
    'use strict';

    const DEFAULT_SETTINGS = {
        refreshTime: 10,
        notificationsEnabled: true,
        lastSeenDate: null
    };

    function getSettings() {
        return {
            refreshTime: GM_getValue('refreshTime', DEFAULT_SETTINGS.refreshTime),
            notificationsEnabled: GM_getValue('notificationsEnabled', DEFAULT_SETTINGS.notificationsEnabled),
            lastSeenDate: GM_getValue('lastSeenDate', DEFAULT_SETTINGS.lastSeenDate)
        };
    }

    // Sends system-level push notification using the GreaseMonkey API. Used for new available bookings, as they are time-sensitive.
    async function sendPushNotification(title, body) {
        const settings = getSettings();
        if (settings.notificationsEnabled) {
            try {
                await GM.notification({
                    title: title,
                    text: body,
                    highlight: true,
                    timeout: 0,

                    // Surprised this isn't default
                    onclick: function() {
                        window.focus();
                    }
                });
                console.log('Notification sent successfully');
            } catch (error) {
                console.error('Error sending notification:', error);
                showNotification('Failed to send system notification. Check notification permissions.', 3000);
            }
        }
    }

    function createSettingsMenu() {
        const settings = getSettings();

        // Create settings menu
        const menuDiv = document.createElement('div');
        menuDiv.style.position = 'fixed';
        menuDiv.style.top = '20px';
        menuDiv.style.left = '20px';
        menuDiv.style.backgroundColor = '#ffffff';
        menuDiv.style.padding = '15px';
        menuDiv.style.borderRadius = '5px';
        menuDiv.style.zIndex = '9999';
        menuDiv.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        menuDiv.style.minWidth = '200px';
        menuDiv.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 10px;">Booking Finder Settings</div>
            <div style="margin-bottom: 10px;">
                <label>
                    Refresh Time (seconds):
                    <input type="number" id="refreshTime" value="${settings.refreshTime}" min="5" style="width: 60px">
                </label>
            </div>
            <div style="margin-bottom: 10px;">
                <label>
                    <input type="checkbox" id="notificationsEnabled" ${settings.notificationsEnabled ? 'checked' : ''}>
                    Enable Push Notifications
                </label>
            </div>
            <button id="saveSettings" style="background-color: #4CAF50; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">
                Save Settings
            </button>
        `;

        // Render settings menu and add save listener
        document.body.appendChild(menuDiv);
        document.getElementById('saveSettings').addEventListener('click', async function() {
            const newRefreshTime = Math.max(5, parseInt(document.getElementById('refreshTime').value) || DEFAULT_SETTINGS.refreshTime);
            const newNotificationsEnabled = document.getElementById('notificationsEnabled').checked;

            // Test notification
            if (newNotificationsEnabled && !getSettings().notificationsEnabled) {
                try {
                    await sendPushNotification(
                        'Test Notification',
                        'Notifications are now enabled. You will be notified when earlier booking times become available.'
                    );
                } catch (error) {
                    console.error('Failed to send test notification:', error);
                    document.getElementById('notificationsEnabled').checked = false;
                    showNotification('Failed to enable notifications. Please check your browser settings.', 3000);
                    return;
                }
            }

            // Save new settings
            GM_setValue('refreshTime', newRefreshTime);
            GM_setValue('notificationsEnabled', newNotificationsEnabled);

            showNotification('Settings saved!', 2000);
        });
    }

    // Parse JSON timetable data
    function findEarliestDate(timeslots) {
        let earliestDate = null;

        if (timeslots && timeslots.ajaxresult && timeslots.ajaxresult.slots && timeslots.ajaxresult.slots.listTimeSlot) {
            const availableSlots = timeslots.ajaxresult.slots.listTimeSlot.filter(slot => slot.availability === true);

            if (availableSlots.length > 0) {
                // Get the first available slot (they're already sorted by date/time)
                const firstSlot = availableSlots[0];
                earliestDate = firstSlot.startTime;
            }
        }

        return earliestDate;
    }

    // Clicks the button to trigger getEarliestTime();
    function clickEarliestTimeButton() {
        const button = document.getElementById('getEarliestTime');
        if (button) {
            console.log('Clicking getEarliestTime button at:', new Date().toLocaleTimeString());
            button.click();
        }
    }

    // Notification to be embedded in the webpage (For monitoring or non-important notifications)
    function showNotification(message, duration = null) {
        const settings = getSettings();

        // Render notification
        const notifDiv = document.createElement('div');
        notifDiv.style.position = 'fixed';
        notifDiv.style.top = '20px';
        notifDiv.style.right = '20px';
        notifDiv.style.backgroundColor = '#4CAF50';
        notifDiv.style.color = 'white';
        notifDiv.style.padding = '15px';
        notifDiv.style.borderRadius = '5px';
        notifDiv.style.zIndex = '9999';
        notifDiv.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';

        notifDiv.textContent = message;

        // Close button
        const closeButton = document.createElement('button');
        closeButton.textContent = '×';
        closeButton.style.marginLeft = '10px';
        closeButton.style.border = 'none';
        closeButton.style.background = 'none';
        closeButton.style.color = 'white';
        closeButton.style.fontSize = '20px';
        closeButton.style.cursor = 'pointer';
        closeButton.onclick = () => notifDiv.remove();

        notifDiv.appendChild(closeButton);
        document.body.appendChild(notifDiv);

        // Remove notification and click button after specified time
        const timeout = duration || (settings.refreshTime * 1000);
        setTimeout(() => {
            notifDiv.remove();
            if (!duration) { // Only click if this is a regular notification, not a settings notification
                clickEarliestTimeButton();
            }
        }, timeout);
    }

    function checkForTimeslots() {
        const settings = getSettings();

        // The Dojo wordpress module injects booking data of the week into a script header.
        // Identifies the correct header and find the earliest available booking in that week.
        // This works on the fact that the getEarliestAvailableDate() button brings us to the
        // earliest week there is a free booking
        const scripts = document.getElementsByTagName('script');

        for (let script of scripts) {
            const content = script.textContent || script.innerText;

            if (content.includes('var timeslots =')) {
                try {
                    const timeslotsMatch = content.match(/var timeslots = ({[\s\S]*?});/);

                    // Get JSON timetable data
                    if (timeslotsMatch) {
                        const timeslotsData = JSON.parse(timeslotsMatch[1]);
                        const earliestDate = findEarliestDate(timeslotsData);

                        if (earliestDate) {
                            // Check if date has changed and notifications should be sent
                            if (settings.notificationsEnabled &&
                                settings.lastSeenDate &&
                                earliestDate !== settings.lastSeenDate) {
                                sendPushNotification(
                                    'New Booking Time Available!',
                                    `A new earliest booking time is available: ${earliestDate}`
                                );
                            }

                            // Update last seen date
                            GM_setValue('lastSeenDate', earliestDate);

                            showNotification(`Earliest available booking: ${earliestDate}\nNext refresh in ${settings.refreshTime} seconds`);
                        }
                    }
                } catch (error) {
                    console.error('Error parsing timeslots:', error);
                }
                break;
            }
        }
    }

    // Run when the page loads
    window.addEventListener('load', async () => {
        // Request notification permission if enabled but not yet granted
        const settings = getSettings();
        if (settings.notificationsEnabled && Notification.permission !== 'granted') {
            await Notification.requestPermission();
        }

        createSettingsMenu();
        checkForTimeslots();
    });
})();