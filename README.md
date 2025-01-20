# RTA Booking Notifier
UserScript app to notify user on changes to booking availability/cancellations at a Service NSW location.

# Requirements
1. Service NSW account able to book a driving test (Passed DKT + HPT)
2. Userscript manager:
  - [Tampermonkey](https://www.tampermonkey.net/) (Chrome, Microsoft Edge, Safari, Opera, Firefox)
  - [Greasemonkey](http://www.greasespot.net/) (Firefox)

# Usage
1.   Open the raw userscript file [here](https://github.com/why7e/rta-booking-notifier/raw/refs/heads/main/bookingfinder.user.js)
2.   Your Userscript manager will prompt you to install the script, click 'Install'
3.   Sign into ServiceNSW and navigate to the booking page for a test centre of your choice
4.   Click 'Find the earliest available timeslot' to open the earliest bookable week to initialise the script
![{66C26F2B-153B-446F-951C-DC5F9909EA43}](https://github.com/user-attachments/assets/ffe6efba-2229-4ade-9318-b2c805a52d66)
5. You may be prompted to provide notification permissions. Notifications can be disabled in the settings menu.
6. The script is active when the green popup appears and the page begins to refresh periodically.
![{566CFF6F-B5A3-4C20-80CE-2990A63E40E7}](https://github.com/user-attachments/assets/5b5b2986-5601-470d-865f-c2be17e0fb9b)
7. You can now open a new tab and leave the script working in the background. 
8. When a change in the earliest available booking is detected, the booking tab will come into focus and a system notification will appear.
   You will then be able to select the slot and continue with the booking as normal.
   
  ![Untitled](https://github.com/user-attachments/assets/ad124eaa-8f1e-4bd3-bd1c-6a7dae5900f6)

# Common Issues
**No notification appears for a change in earliest available booking**
* Ensure your system notifications are enabled.

![Untitled](https://github.com/user-attachments/assets/d26e4668-bbc3-49a9-af4a-6f618f0c6c41)

**The script is not refreshing the page periodically**
* The current version of the script does not refresh when no available booking is detected on the page. Click 'Find the earliest available timeslot' to navigate to a page where there is an available booking. Currently if there are no available bookings at all as seen below, the script will not work.
  
![{9E2315E9-86DF-4083-95B9-2925BD2F263D}](https://github.com/user-attachments/assets/ea70c29e-c972-4438-8fb8-34de024f3a11)
