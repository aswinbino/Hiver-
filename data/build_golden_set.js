import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const GOLDEN_SET_PATH = path.join(PROJECT_ROOT, 'data', 'golden_set.json');

const INTENTS = [
  'Software & Update Issues',
  'Hardware & Battery Malfunction',
  'Account, Apple ID & Security',
  'App Store & In-App Purchases',
  'Connectivity (Wi-Fi, Cellular, Bluetooth)',
  'General Inquiry & How-To'
];

/**
 * Generates 150 diverse, high-quality golden test entries
 * covering standard resolutions, safety hazards, auth requirements,
 * legal threats, ambiguous inputs, and hardware edge cases.
 */
function generateGoldenSet() {
  const dataset = [];

  const templates = [
    // 1. Software & Update Issues (Auto-handle and escalations)
    {
      intent: 'Software & Update Issues',
      queries: [
        { q: 'My iPhone 14 froze during the iOS 17 update bar. How can I force restart it?', d: 'AUTO_HANDLE', e: 'NONE', r: 'Quickly press and release Volume Up, then Volume Down, then hold the Side button until the Apple logo appears.' },
        { q: 'Storage calculation says System Data is taking up 70GB on iOS 16. Any fix?', d: 'AUTO_HANDLE', e: 'NONE', r: 'Try connecting your device to a Mac or PC and syncing with Finder/iTunes, or creating a backup and restoring.' },
        { q: 'Apps keep crashing immediately after launching since updating to iOS 17.2.', d: 'AUTO_HANDLE', e: 'NONE', r: 'Check the App Store for app updates, restart your phone, and ensure at least 3-5GB of available storage.' },
        { q: 'MacBook Air running Sonoma kernel panics every time it wakes from sleep.', d: 'AUTO_HANDLE', e: 'NONE', r: 'Try booting into Safe Mode by holding the power button, and disconnect any third-party external hubs.' },
        { q: 'Safari won’t open any web pages after the recent security patch.', d: 'AUTO_HANDLE', e: 'NONE', r: 'Go to Settings > Safari > Clear History and Website Data, then restart Safari.' },
        { q: 'iPhone stuck in continuous boot loop showing black screen and white apple logo.', d: 'AUTO_HANDLE', e: 'NONE', r: 'Connect your iPhone to a computer, enter Recovery Mode, and choose Update instead of Restore to preserve data.' },
        { q: 'Camera app shows black screen on my iPhone 12 after iOS 16.5 update.', d: 'AUTO_HANDLE', e: 'NONE', r: 'Close the Camera app from the app switcher, restart the iPhone, and test if FaceTime or third-party camera apps work.' },
        { q: 'Notifications sound alert works but screen doesn’t wake up on incoming messages.', d: 'AUTO_HANDLE', e: 'NONE', r: 'Check Settings > Notifications > Show Previews, and verify Focus or Do Not Disturb settings are disabled.' },
        { q: 'Apple Books app is crashing every time I open a downloaded PDF textbook.', d: 'AUTO_HANDLE', e: 'NONE', r: 'Force close Apple Books, restart the iPad, and verify if other PDF files open properly.' },
        { q: 'AirDrop is failing to receive files from my Mac to my iPhone running iOS 17.', d: 'AUTO_HANDLE', e: 'NONE', r: 'Ensure both devices have Wi-Fi and Bluetooth enabled, and set AirDrop receiving to Everyone for 10 Minutes.' },
        { q: 'CarPlay screen stays completely blank when plugged in via USB cable.', d: 'AUTO_HANDLE', e: 'NONE', r: 'Check Settings > General > CarPlay, forget the vehicle, and reconnect using an official Apple MFi certified cable.' },
        { q: 'Face ID stopped working after software update, says TrueDepth camera issue.', d: 'AUTO_HANDLE', e: 'NONE', r: 'Clean the TrueDepth sensor area at the top of the display, reset Face ID in Settings, and restart your device.' },
        { q: 'Widget on home screen shows blank black box and refuses to refresh data.', d: 'AUTO_HANDLE', e: 'NONE', r: 'Long press the widget, remove it, reboot your iPhone, and re-add the widget from the gallery.' },
        { q: 'Dictation button on keyboard is unresponsive and grayed out in iMessage.', d: 'AUTO_HANDLE', e: 'NONE', r: 'Verify Dictation is toggled on in Settings > General > Keyboard > Enable Dictation.' },
        { q: 'Overheating software bug: iPhone is literally burning my hand and battery is swelling up!', d: 'ESCALATE', e: 'SAFETY_HAZARD', r: 'Stop using and charging device immediately. Escalating to Senior Safety Engineering.' },
        { q: 'I demand immediate monetary damages because your iOS update broke my production workflow or my lawyer will file suit!', d: 'ESCALATE', e: 'LEGAL_THREAT', r: 'Referral to Executive Customer Relations legal team.' },
        { q: 'Phone crashed and now my phone is stolen by someone at the station!', d: 'ESCALATE', e: 'HARDWARE_DAMAGE', r: 'Escalating for theft and law enforcement assistance.' },
        { q: 'update broken', d: 'ESCALATE', e: 'LOW_CONFIDENCE', r: 'Low confidence ambiguous query routing to human specialist.' },
        { q: 'Why does my iPad say iPad unavailable press restart?', d: 'AUTO_HANDLE', e: 'NONE', r: 'Follow on-screen prompt to connect to Wi-Fi and use Apple ID credentials, or connect to Finder to restore.' },
        { q: 'Voice memos won’t sync across iCloud to my MacBook.', d: 'AUTO_HANDLE', e: 'NONE', r: 'Check Settings > [Your Name] > iCloud > Show All and verify Voice Memos toggle is active on both devices.' },
        { q: 'Screen rotation lock is stuck in landscape mode on iPhone 11.', d: 'AUTO_HANDLE', e: 'NONE', r: 'Swipe down Control Center, toggle Portrait Orientation Lock on and off, and force restart if unresponsive.' },
        { q: 'Personal Hotspot option is missing from iPhone Settings menu.', d: 'AUTO_HANDLE', e: 'NONE', r: 'Contact your cellular provider to verify your plan includes Personal Hotspot, or reset network settings.' },
        { q: 'Notes app with scanned documents suddenly disappeared after updating.', d: 'AUTO_HANDLE', e: 'NONE', r: 'Check Recently Deleted folder in Notes, and confirm iCloud Notes is enabled in iCloud settings.' },
        { q: 'Keyboard haptic feedback stopped vibrating after iOS 17.1.', d: 'AUTO_HANDLE', e: 'NONE', r: 'Navigate to Settings > Sounds & Haptics > Keyboard Feedback and toggle Haptic to On.' },
        { q: 'Software update says verification failed because you are no longer connected to internet.', d: 'AUTO_HANDLE', e: 'NONE', r: 'Delete downloaded update file from Settings > General > iPhone Storage, reconnect to Wi-Fi, and re-download.' }
      ]
    },

    // 2. Hardware & Battery Malfunction
    {
      intent: 'Hardware & Battery Malfunction',
      queries: [
        { q: 'My iPhone 12 battery health dropped to 78% and service notification is showing.', d: 'AUTO_HANDLE', e: 'NONE', r: 'Batteries below 80% maximum capacity can be replaced at an Apple Store or authorized service provider.' },
        { q: 'Earpiece speaker volume during phone calls is extremely low and muffled.', d: 'AUTO_HANDLE', e: 'NONE', r: 'Clean the speaker mesh with a clean soft-bristled brush and verify Phone Noise Cancellation settings.' },
        { q: 'My iPhone 15 Pro gets warm when shooting 4K ProRes video for 20 minutes.', d: 'AUTO_HANDLE', e: 'NONE', r: 'Heavy video processing generates normal thermal warmth; ensure the device is not exposed to direct sunlight.' },
        { q: 'Taptic engine vibrating sensation sounds like a loud mechanical rattle.', d: 'AUTO_HANDLE', e: 'NONE', r: 'This indicates a hardware component issue; book a Genius Bar appointment for hardware inspection.' },
        { q: 'Lightning charging port is loose and cable only charges when held at an angle.', d: 'AUTO_HANDLE', e: 'NONE', r: 'Inspect the port carefully for pocket lint using a non-conductive wooden toothpick, or visit an Apple Store.' },
        { q: 'MacBook Pro MagSafe LED light is blinking green and amber and not charging.', d: 'AUTO_HANDLE', e: 'NONE', r: 'Unplug the power adapter from wall outlet for 60 seconds, inspect cable pins, and test on a different wall outlet.' },
        { q: 'Battery is smoking and bubbling! The phone just caught fire on my nightstand!', d: 'ESCALATE', e: 'SAFETY_HAZARD', r: 'Severe fire hazard. Discontinue use immediately. Escalating to Senior Safety Engineering.' },
        { q: 'iPhone back glass is bulging outwards and feels scalding hot to touch.', d: 'ESCALATE', e: 'SAFETY_HAZARD', r: 'Battery swelling hazard. Unplug immediately and do not compress. Escalating to safety team.' },
        { q: 'My iPhone got run over by a truck and the screen is shattered into sharp glass fragments everywhere.', d: 'ESCALATE', e: 'HARDWARE_DAMAGE', r: 'Severe physical destruction requiring mail-in depot service or hardware replacement.' },
        { q: 'Dropped phone in the deep ocean and it won’t power on after drying for 3 days.', d: 'ESCALATE', e: 'HARDWARE_DAMAGE', r: 'Corrosive saltwater submersion requires out-of-warranty hardware replacement.' },
        { q: 'battery', d: 'ESCALATE', e: 'LOW_CONFIDENCE', r: 'Single word ambiguous input. Low confidence escalation.' },
        { q: 'Microphone during calls sounds like I am underwater, but Siri hears me fine.', d: 'AUTO_HANDLE', e: 'NONE', r: 'Check the bottom microphone opening for debris, and record a test memo in the Voice Memos app to isolate.' },
        { q: 'Apple Watch Digital Crown feels sticky and is difficult to rotate.', d: 'AUTO_HANDLE', e: 'NONE', r: 'Turn off the watch and rinse the Digital Crown under light warm tap water for 10-15 seconds while turning it.' },
        { q: 'iPad screen shows a faint vertical green line running from top to bottom.', d: 'AUTO_HANDLE', e: 'NONE', r: 'Take a screenshot to see if the line appears in the photo; if not, it is a display panel hardware defect.' },
        { q: 'My iPhone battery percentage jumps randomly from 40% to 10% and shuts down.', d: 'AUTO_HANDLE', e: 'NONE', r: 'This indicates battery cell degradation; schedule a battery diagnostic at an Apple authorized service provider.' },
        { q: 'Front camera lens has internal condensation droplets behind the glass.', d: 'AUTO_HANDLE', e: 'NONE', r: 'Moisture ingress detected; avoid charging and bring the device to an Apple Store for liquid inspection.' },
        { q: 'Wireless MagSafe charger charges for 5 seconds and then stops.', d: 'AUTO_HANDLE', e: 'NONE', r: 'Remove thick or magnetic cases and verify the power brick provides at least 20W USB-C PD power.' },
        { q: 'Top speaker on iPhone 13 crackles only at volume levels above 80%.', d: 'AUTO_HANDLE', e: 'NONE', r: 'Test audio with multiple apps and formats to isolate software distortion from physical speaker blowout.' },
        { q: 'MacBook keyboard spacebar is double typing spaces intermittently.', d: 'AUTO_HANDLE', e: 'NONE', r: 'Use compressed air at a 75-degree angle to clear dust from underneath key mechanisms.' },
        { q: 'iPhone screen ghost-touch clicking apps on its own without my fingers touching it.', d: 'AUTO_HANDLE', e: 'NONE', r: 'Remove any screen protector, unplug third-party charging cables, and clean the display surface.' },
        { q: 'Face ID notch glass has a hairline scratch, does Apple replace just the glass?', d: 'AUTO_HANDLE', e: 'NONE', r: 'Display replacements replace the entire front glass and OLED panel assembly at standard AppleCare rates.' },
        { q: 'Severe electrical shock occurred while unplugging the official Apple 20W charger!', d: 'ESCALATE', e: 'SAFETY_HAZARD', r: 'Electrical shock safety escalation.' },
        { q: 'Someone stole my iPhone 14 Pro Max from my backpack in transit!', d: 'ESCALATE', e: 'HARDWARE_DAMAGE', r: 'Stolen device policy escalation.' },
        { q: 'Does replacing battery delete all my photos and data?', d: 'AUTO_HANDLE', e: 'NONE', r: 'Data is not erased during battery replacement, but we always advise creating an iCloud or PC backup beforehand.' },
        { q: 'Fast charging isn’t working with my USB-C to Lightning cable.', d: 'AUTO_HANDLE', e: 'NONE', r: 'Ensure your power adapter supports USB Power Delivery (PD) and outputs 18W or higher.' }
      ]
    },

    // 3. Account, Apple ID & Security
    {
      intent: 'Account, Apple ID & Security',
      queries: [
        { q: 'How do I change my primary Apple ID email address to a new Gmail address?', d: 'AUTO_HANDLE', e: 'NONE', r: 'Sign in to appleid.apple.com, navigate to Sign-In and Security > Apple ID, and enter your new email address.' },
        { q: 'How can I set up an Account Recovery Contact for my family in iCloud?', d: 'AUTO_HANDLE', e: 'NONE', r: 'Go to Settings > [Your Name] > Sign-In & Security > Account Recovery > Add Recovery Contact.' },
        { q: 'I forgot my Apple ID password and my phone is locked out. Need password reset immediately!', d: 'ESCALATE', e: 'PRIVATE_AUTH', r: 'Password recovery and authentication escalation.' },
        { q: 'Help! My Apple ID account was hacked and someone changed my recovery phone number and email!', d: 'ESCALATE', e: 'PRIVATE_AUTH', r: 'Account takeover security incident escalation.' },
        { q: 'Lost access to my two-factor authentication trusted phone number and have no other devices.', d: 'ESCALATE', e: 'PRIVATE_AUTH', r: '2FA lockout requiring account recovery queue escalation.' },
        { q: 'How do I turn on Advanced Data Protection for iCloud end-to-end encryption?', d: 'AUTO_HANDLE', e: 'NONE', r: 'Open Settings > [Your Name] > iCloud > Advanced Data Protection and follow setup instructions.' },
        { q: 'Can I remove an old iPhone from my trusted devices list?', d: 'AUTO_HANDLE', e: 'NONE', r: 'Go to Settings > [Your Name], scroll down to your devices list, tap the old device, and select Remove from Account.' },
        { q: 'I bought a used iPad on eBay and it has Activation Lock with someone else’s Apple ID.', d: 'ESCALATE', e: 'PRIVATE_AUTH', r: 'Activation lock ownership dispute escalation.' },
        { q: 'I am getting random 2FA verification prompts on my phone that I did not initiate!', d: 'ESCALATE', e: 'PRIVATE_AUTH', r: 'Unauthorized access attempt escalation.' },
        { q: 'How do I add a Legacy Contact to my Apple Account?', d: 'AUTO_HANDLE', e: 'NONE', r: 'Go to Settings > [Your Name] > Sign-In & Security > Legacy Contact > Add Legacy Contact.' },
        { q: 'account', d: 'ESCALATE', e: 'LOW_CONFIDENCE', r: 'Single word query. Low confidence escalation.' },
        { q: 'How to manage App Specific Passwords for third party email clients like Outlook?', d: 'AUTO_HANDLE', e: 'NONE', r: 'Sign in to appleid.apple.com, go to Sign-In and Security > App-Specific Passwords, and generate a new password.' },
        { q: 'What is the difference between iCloud Keychain and passkeys?', d: 'AUTO_HANDLE', e: 'NONE', r: 'iCloud Keychain stores passwords securely, while passkeys replace passwords entirely using biometric FIDO credentials.' },
        { q: 'My Apple ID says it has been locked for security reasons.', d: 'ESCALATE', e: 'PRIVATE_AUTH', r: 'Security lockout escalation.' },
        { q: 'Can I merge two separate Apple IDs into one single account?', d: 'AUTO_HANDLE', e: 'NONE', r: 'Apple IDs cannot be directly merged; purchases and data remain permanently tied to individual accounts.' },
        { q: 'How to revoke access from third party apps using Sign in with Apple?', d: 'AUTO_HANDLE', e: 'NONE', r: 'Go to Settings > [Your Name] > Sign-In & Security > Sign in with Apple, select the app, and tap Stop Using Apple ID.' },
        { q: 'I received a suspicious phishing email claiming my iCloud was suspended.', d: 'AUTO_HANDLE', e: 'NONE', r: 'Do not click links; forward the phishing email directly to reportphishing@apple.com and delete it.' },
        { q: 'If your customer care does not unlock my Apple ID today, my lawyer will serve you papers tomorrow morning!', d: 'ESCALATE', e: 'LEGAL_THREAT', r: 'Hostile legal action escalation.' },
        { q: 'How to turn on Hide My Email for new newsletters?', d: 'AUTO_HANDLE', e: 'NONE', r: 'With iCloud+, go to Settings > [Your Name] > iCloud > Hide My Email > Create New Address.' },
        { q: 'Device was stolen in London and thieves are demanding my passcode via SMS.', d: 'ESCALATE', e: 'HARDWARE_DAMAGE', r: 'Theft and extortion escalation.' },
        { q: 'Can I view which devices are signed in with my Apple ID?', d: 'AUTO_HANDLE', e: 'NONE', r: 'Yes, check the bottom of the Settings > [Your Name] screen or log in to appleid.apple.com.' },
        { q: 'How to set up Security Keys for my Apple ID with YubiKey?', d: 'AUTO_HANDLE', e: 'NONE', r: 'Go to Settings > [Your Name] > Sign-In & Security > Two-Factor Authentication > Add Security Keys.' },
        { q: 'Forgot Screen Time passcode and I cannot reset it using Apple ID.', d: 'ESCALATE', e: 'PRIVATE_AUTH', r: 'Passcode recovery escalation.' },
        { q: 'How to transfer Family Sharing organizer role to another adult?', d: 'AUTO_HANDLE', e: 'NONE', r: 'The Family Sharing organizer cannot be transferred directly; the group must be disbanded and re-created.' },
        { q: 'Where do I find my Apple ID recovery key that I generated last year?', d: 'AUTO_HANDLE', e: 'NONE', r: 'Apple does not store your recovery key; if lost, you can generate a new one while signed in to a trusted device.' }
      ]
    },

    // 4. App Store & In-App Purchases
    {
      intent: 'App Store & In-App Purchases',
      queries: [
        { q: 'How do I cancel an unwanted auto-renewing subscription on my iPhone?', d: 'AUTO_HANDLE', e: 'NONE', r: 'Go to Settings > [Your Name] > Subscriptions, tap the subscription, and select Cancel Subscription.' },
        { q: 'How to check my purchase history for App Store downloads from last month?', d: 'AUTO_HANDLE', e: 'NONE', r: 'Go to Settings > [Your Name] > Media & Purchases > View Account > Purchase History.' },
        { q: 'I was double charged $99.99 for an in-app purchase I never authorized. I demand a full refund dispute!', d: 'ESCALATE', e: 'PRIVATE_AUTH', r: 'Unauthorized billing dispute escalation.' },
        { q: 'Your company fraudulently charged my credit card without consent, I will sue Apple for theft!', d: 'ESCALATE', e: 'LEGAL_THREAT', r: 'Financial fraud allegation and legal threat escalation.' },
        { q: 'App Store says verification required and asks to update payment method for free apps.', d: 'AUTO_HANDLE', e: 'NONE', r: 'This occurs when an unpaid balance exists; update your payment information in Settings > [Your Name] > Payment & Shipping.' },
        { q: 'How can I redeem an Apple Gift Card on my iPad?', d: 'AUTO_HANDLE', e: 'NONE', r: 'Open the App Store, tap your profile icon at top right, and tap Redeem Gift Card or Code.' },
        { q: 'Where do I request a refund for an accidental app purchase my child made?', d: 'AUTO_HANDLE', e: 'NONE', r: 'Visit reportaproblem.apple.com, sign in with your Apple ID, select Request a refund, and choose the reason.' },
        { q: 'App Store download button just spins continuously and never starts downloading.', d: 'AUTO_HANDLE', e: 'NONE', r: 'Pause and restart the download, verify date and time settings are Set Automatically, and restart your device.' },
        { q: 'How to enable Ask to Buy for children in Family Sharing?', d: 'AUTO_HANDLE', e: 'NONE', r: 'Go to Settings > Family > tap your child’s name > Ask to Buy > toggle Require Approval for Purchases.' },
        { q: 'Cannot purchase anything, error says Your Account Has Been Disabled in the App Store and iTunes.', d: 'ESCALATE', e: 'PRIVATE_AUTH', r: 'Account billing freeze escalation.' },
        { q: 'app store', d: 'ESCALATE', e: 'LOW_CONFIDENCE', r: 'Vague query. Low confidence escalation.' },
        { q: 'How do I share my purchased apps with family members?', d: 'AUTO_HANDLE', e: 'NONE', r: 'Enable Purchase Sharing in Settings > Family > Purchase Sharing, and confirm Share Purchases with Family is on.' },
        { q: 'Why is an app not available in my country or region store?', d: 'AUTO_HANDLE', e: 'NONE', r: 'App developers choose which regions to distribute apps; changing store regions requires canceling active subscriptions.' },
        { q: 'How to turn off in-app purchases completely on my teenager’s iPhone?', d: 'AUTO_HANDLE', e: 'NONE', r: 'Go to Settings > Screen Time > Content & Privacy Restrictions > iTunes & App Store Purchases > In-app Purchases > Don’t Allow.' },
        { q: 'Charged three times for iCloud 2TB storage tier this billing cycle!', d: 'ESCALATE', e: 'PRIVATE_AUTH', r: 'Multiple billing charge dispute escalation.' },
        { q: 'Can I use PayPal as a payment method for Apple services?', d: 'AUTO_HANDLE', e: 'NONE', r: 'Yes, PayPal is supported in many countries; add it under Settings > [Your Name] > Payment & Shipping.' },
        { q: 'How do I restore in-app purchases after reinstalling a game on new iPhone?', d: 'AUTO_HANDLE', e: 'NONE', r: 'Open the app’s settings menu and tap Restore Purchases while signed into the same Apple ID.' },
        { q: 'Why did my Apple Music subscription cancel itself automatically?', d: 'AUTO_HANDLE', e: 'NONE', r: 'Check if your primary payment method expired or was declined by contacting your financial institution.' },
        { q: 'Filing a formal consumer protection bureau fraud complaint against Apple over App Store policies!', d: 'ESCALATE', e: 'LEGAL_THREAT', r: 'Regulatory consumer complaint escalation.' },
        { q: 'How to view active Apple Arcade subscription details on Apple TV?', d: 'AUTO_HANDLE', e: 'NONE', r: 'Open Settings on Apple TV, go to Users and Accounts > [Your Account] > Subscriptions > Apple Arcade.' },
        { q: 'Can I get a refund for a movie rented on Apple TV app that wouldn’t stream?', d: 'AUTO_HANDLE', e: 'NONE', r: 'Sign in to reportaproblem.apple.com within 14 days and submit a refund claim for playback failure.' },
        { q: 'How to change billing currency in the App Store?', d: 'AUTO_HANDLE', e: 'NONE', r: 'Billing currency is tied to your country/region; changing region requires spending remaining store credit balance.' },
        { q: 'What is Apple Pay Daily Cash and where is it deposited?', d: 'AUTO_HANDLE', e: 'NONE', r: 'Daily Cash is credited to your Apple Cash card in Wallet or to an Apple High-Yield Savings account if enabled.' },
        { q: 'Card was charged $500 while my stolen iPhone was unlocked!', d: 'ESCALATE', e: 'HARDWARE_DAMAGE', r: 'Fraudulent transaction on stolen hardware escalation.' },
        { q: 'How to pre-order an upcoming book in Apple Books?', d: 'AUTO_HANDLE', e: 'NONE', r: 'Find the title in Apple Books, tap Pre-Order, and the book will automatically download on release day.' }
      ]
    },

    // 5. Connectivity (Wi-Fi, Cellular, Bluetooth)
    {
      intent: 'Connectivity (Wi-Fi, Cellular, Bluetooth)',
      queries: [
        { q: 'Wi-Fi disconnects every time my iPhone locks or goes to sleep.', d: 'AUTO_HANDLE', e: 'NONE', r: 'Forget the Wi-Fi network in Settings > Wi-Fi, toggle Auto-Join on, and ensure Low Data Mode is turned off.' },
        { q: 'iPhone says No Service and won’t connect to cellular network after landing in Europe.', d: 'AUTO_HANDLE', e: 'NONE', r: 'Verify Data Roaming is turned on in Settings > Cellular > Cellular Data Options, and toggle Airplane Mode.' },
        { q: 'AirPods Pro sound keeps cutting out intermittently when phone is in my back pocket.', d: 'AUTO_HANDLE', e: 'NONE', r: 'Reset your AirPods by putting them in the case, holding the setup button for 15 seconds, and re-pairing.' },
        { q: 'Bluetooth toggle in Control Center is grayed out and spinning continuously.', d: 'AUTO_HANDLE', e: 'NONE', r: 'Force restart the device and reset network settings in Settings > General > Transfer or Reset iPhone > Reset.' },
        { q: 'Cannot connect to 5GHz Wi-Fi network, only 2.4GHz is visible on MacBook.', d: 'AUTO_HANDLE', e: 'NONE', r: 'Restart your Wi-Fi router, delete the saved network from System Settings > Wi-Fi > Known Networks, and reconnect.' },
        { q: 'eSIM won’t activate on new iPhone 15, stuck on Activating status screen.', d: 'AUTO_HANDLE', e: 'NONE', r: 'Connect to Wi-Fi, restart the iPhone, and contact your carrier to refresh the eSIM profile QR code.' },
        { q: 'Phone spark and electrical shock when plugging in cellular antenna booster!', d: 'ESCALATE', e: 'SAFETY_HAZARD', r: 'Electrical shock hazard escalation.' },
        { q: 'I am taking legal action against Apple because your connectivity flaw ruined my million dollar trade!', d: 'ESCALATE', e: 'LEGAL_THREAT', r: 'High value legal damages escalation.' },
        { q: 'wifi', d: 'ESCALATE', e: 'LOW_CONFIDENCE', r: 'Single word input. Low confidence escalation.' },
        { q: 'Personal hotspot connects but laptop says Connected, No Internet.', d: 'AUTO_HANDLE', e: 'NONE', r: 'Toggle Maximize Compatibility in Settings > Personal Hotspot, and verify your carrier allows hotspot data.' },
        { q: 'Bluetooth audio latency lag in car stereo when playing YouTube videos.', d: 'AUTO_HANDLE', e: 'NONE', r: 'Car infotainment systems often introduce audio buffering delay over Bluetooth; use CarPlay or AUX if supported.' },
        { q: 'Cellular data speed is capped at 3G speeds even in 5G coverage areas.', d: 'AUTO_HANDLE', e: 'NONE', r: 'Navigate to Settings > Cellular > Cellular Data Options > Voice & Data, and select 5G Auto.' },
        { q: 'Apple Watch keeps disconnecting from iPhone when leaving the room.', d: 'AUTO_HANDLE', e: 'NONE', r: 'Ensure both Wi-Fi and Bluetooth are active on iPhone so Apple Watch can seamlessly switch to Wi-Fi connection.' },
        { q: 'Stolen iPhone 13 cellular connection was remotely severed by thief.', d: 'ESCALATE', e: 'HARDWARE_DAMAGE', r: 'Theft tracking escalation.' },
        { q: 'Wi-Fi Calling refuses to turn on, says Contact your carrier.', d: 'AUTO_HANDLE', e: 'NONE', r: 'Contact your wireless provider to ensure your emergency 911 address is registered on file.' },
        { q: 'AirDrop refuses to discover anyone even when set to Everyone for 10 minutes.', d: 'AUTO_HANDLE', e: 'NONE', r: 'Turn off Personal Hotspot as it prevents AirDrop from operating, and toggle Wi-Fi and Bluetooth.' },
        { q: 'iPhone 11 Bluetooth won’t connect to my third-party fitness tracker.', d: 'AUTO_HANDLE', e: 'NONE', r: 'Unpair the tracker in Settings > Bluetooth, install the manufacturer companion app, and pair inside the app.' },
        { q: 'Cellular network shows SOS Only in the status bar.', d: 'AUTO_HANDLE', e: 'NONE', r: 'This indicates no carrier signal; re-seat physical SIM card, check carrier outage maps, or contact provider.' },
        { q: 'MacBook Wi-Fi says Self-Assigned IP address 169.254 and cannot browse web.', d: 'AUTO_HANDLE', e: 'NONE', r: 'Renew DHCP Lease in System Settings > Network > Wi-Fi > Details > TCP/IP > Renew DHCP Lease.' },
        { q: 'AirPods microphone not picking up voice during cellular phone calls.', d: 'AUTO_HANDLE', e: 'NONE', r: 'Go to Settings > Bluetooth > AirPods (i) > Microphone, and toggle from Automatic to Always Left or Right.' },
        { q: 'Carrier settings update prompt keeps popping up every 10 minutes.', d: 'AUTO_HANDLE', e: 'NONE', r: 'Tap Update, go to Settings > General > About, and reboot device to complete installation.' },
        { q: 'Phone caught fire while searching for 5G cellular signal!', d: 'ESCALATE', e: 'SAFETY_HAZARD', r: 'Fire hazard escalation.' },
        { q: 'Class action lawsuit will be served if Apple does not fix Bluetooth connectivity bug!', d: 'ESCALATE', e: 'LEGAL_THREAT', r: 'Legal action escalation.' },
        { q: 'How to forget a Wi-Fi network on Apple Watch directly?', d: 'AUTO_HANDLE', e: 'NONE', r: 'Open Settings on Apple Watch, tap Wi-Fi, tap the network name, and tap Forget This Network.' },
        { q: 'Why does Private Wi-Fi Address cause login issues on hotel captive portals?', d: 'AUTO_HANDLE', e: 'NONE', r: 'Some hotel portals require static MAC addresses; temporarily toggle Private Wi-Fi Address off for that network.' }
      ]
    },

    // 6. General Inquiry & How-To
    {
      intent: 'General Inquiry & How-To',
      queries: [
        { q: 'How do I take a scrolling full page screenshot in Safari on iPhone?', d: 'AUTO_HANDLE', e: 'NONE', r: 'Take a screenshot, tap the preview thumbnail, select the Full Page tab at the top, and tap Done to save PDF.' },
        { q: 'Where do I find my iPhone serial number and model number?', d: 'AUTO_HANDLE', e: 'NONE', r: 'Go to Settings > General > About to view your Model Name, Model Number, and Serial Number.' },
        { q: 'How do I turn on Night Shift mode to reduce blue light on my iPad?', d: 'AUTO_HANDLE', e: 'NONE', r: 'Open Settings > Display & Brightness > Night Shift, and toggle Manually Enable Until Tomorrow or set a schedule.' },
        { q: 'Can I use an Apple Pencil 1st generation with an iPad Air 5th generation?', d: 'AUTO_HANDLE', e: 'NONE', r: 'iPad Air 5 requires the Apple Pencil (2nd generation) or Apple Pencil (USB-C); 1st gen is not compatible.' },
        { q: 'How do I transfer photos from my iPhone to a Windows 11 PC using cable?', d: 'AUTO_HANDLE', e: 'NONE', r: 'Connect via USB, unlock your iPhone, tap Trust This Computer, and import photos using the Windows Photos app.' },
        { q: 'What is the trade-in value of an iPhone 12 in good condition?', d: 'AUTO_HANDLE', e: 'NONE', r: 'Visit apple.com/shop/trade-in to get an exact estimated trade-in valuation based on your device condition.' },
        { q: 'how', d: 'ESCALATE', e: 'LOW_CONFIDENCE', r: 'Single word how query. Low confidence escalation.' },
        { q: 'Someone stole my device and I need police assistance through Apple legal department!', d: 'ESCALATE', e: 'HARDWARE_DAMAGE', r: 'Theft and police escalation.' },
        { q: 'Apple is engaging in false advertising and my attorney will report you to the FTC!', d: 'ESCALATE', e: 'LEGAL_THREAT', r: 'Regulatory legal escalation.' },
        { q: 'How do I customize Lock Screen widgets and clock fonts on iOS 17?', d: 'AUTO_HANDLE', e: 'NONE', r: 'Touch and hold your Lock Screen, tap Customize, choose Lock Screen, and tap the clock or widget areas to edit.' },
        { q: 'Can I use two different physical SIM cards simultaneously in US iPhone 14?', d: 'AUTO_HANDLE', e: 'NONE', r: 'US models of iPhone 14 do not have physical SIM trays; they support Dual eSIM functionality instead.' },
        { q: 'How to clean an Apple Studio Display with nano-texture glass safely?', d: 'AUTO_HANDLE', e: 'NONE', r: 'Use only the included official Apple polishing cloth; never use acetone, window cleaners, or abrasive cloths.' },
        { q: 'Does AppleCare+ cover loss and theft internationally?', d: 'AUTO_HANDLE', e: 'NONE', r: 'AppleCare+ with Theft and Loss coverage applies primarily in the country of purchase; check policy terms for specifics.' },
        { q: 'How do I enable Battery Percentage indicator inside the battery icon?', d: 'AUTO_HANDLE', e: 'NONE', r: 'Go to Settings > Battery and toggle Battery Percentage to On.' },
        { q: 'Device battery exploded in my pocket causing third degree burns!', d: 'ESCALATE', e: 'SAFETY_HAZARD', r: 'Severe bodily injury safety escalation.' },
        { q: 'How do I pair an Apple TV Remote with my Apple TV 4K?', d: 'AUTO_HANDLE', e: 'NONE', r: 'Point the remote at the Apple TV from 3 inches away, and press and hold Back (<) and Volume Up (+) for 5 seconds.' },
        { q: 'Can I connect a Bluetooth mouse and trackpad to my iPad Pro?', d: 'AUTO_HANDLE', e: 'NONE', r: 'Yes, put the mouse in discovery mode, open Settings > Bluetooth on iPad, and tap your device to pair.' },
        { q: 'How do I share my Wi-Fi password with a friend without typing it?', d: 'AUTO_HANDLE', e: 'NONE', r: 'Keep both devices unlocked near each other with Wi-Fi and Bluetooth on; a Share Password prompt will appear.' },
        { q: 'My Apple ID was compromised in a data breach, need security review.', d: 'ESCALATE', e: 'PRIVATE_AUTH', r: 'Security breach escalation.' },
        { q: 'How to turn on StandBy mode when charging iPhone horizontally?', d: 'AUTO_HANDLE', e: 'NONE', r: 'Connect your iPhone to a charger, place it on its side at an angle, and StandBy mode will automatically engage.' },
        { q: 'Where can I recycle old Apple chargers and lithium batteries responsibly?', d: 'AUTO_HANDLE', e: 'NONE', r: 'You can bring any Apple product or battery to any Apple Retail Store for free responsible recycling.' },
        { q: 'How to set up Family Checklist on iOS?', d: 'AUTO_HANDLE', e: 'NONE', r: 'Go to Settings > Family > Family Checklist to configure parental controls, location sharing, and emergency contacts.' },
        { q: 'What is the water resistance rating of Apple Watch Ultra 2?', d: 'AUTO_HANDLE', e: 'NONE', r: 'Apple Watch Ultra 2 has a water resistance rating of 100 meters under ISO standard 22810 and is dive certified to 40m.' },
        { q: 'Lawsuit notice: Failure to provide how-to documentation led to major loss!', d: 'ESCALATE', e: 'LEGAL_THREAT', r: 'Legal action escalation.' },
        { q: 'How to enable Reachability gesture on iPhones without a Home button?', d: 'AUTO_HANDLE', e: 'NONE', r: 'Go to Settings > Accessibility > Touch, toggle Reachability on, then swipe down on the bottom edge of the screen.' }
      ]
    }
  ];

  let idCounter = 1;

  for (const group of templates) {
    for (const item of group.queries) {
      dataset.push({
        id: `golden_${String(idCounter).padStart(3, '0')}`,
        customer_query: item.q,
        ground_truth_intent: group.intent,
        true_decision: item.d,
        escalation_type: item.e,
        ground_truth_reply: item.r,
        reference_quality_score: item.d === 'AUTO_HANDLE' ? 5 : 4
      });
      idCounter++;
    }
  }

  console.log(`[GoldenSet] Generated ${dataset.length} balanced evaluation test cases.`);
  fs.writeFileSync(GOLDEN_SET_PATH, JSON.stringify(dataset, null, 2), 'utf8');
  console.log(`[GoldenSet] Saved dataset to ${GOLDEN_SET_PATH}`);
}

generateGoldenSet();
