# Noor Connect

This is a hybrid application built using web technologies and wrapped for Android using Capacitor.

## Technologies Used

This project is built with:

*   **Vite:** For the web frontend development server and build tooling.
*   **React:** For building the user interface.
*   **TypeScript:** For type-safe JavaScript.
*   **shadcn/ui:** A collection of reusable UI components.
*   **Tailwind CSS:** For styling the application.
*   **Capacitor:** For creating the native Android wrapper.

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

*   **Node.js and npm:** Make sure you have Node.js and npm installed. You can download them from [nodejs.org](https://nodejs.org/).
*   **Android Studio:** You will need Android Studio to build and run the Android application on an emulator or a physical device. Download it from [developer.android.com/studio](https://developer.android.com/studio).

### Development Workflow

1.  **Clone the repository:**
    ```sh
    git clone <YOUR_GIT_URL>
    cd Noor-connect
    ```

2.  **Install web dependencies:**
    ```sh
    npm install
    ```

3.  **Run the web app in a browser:**
    To run the web application in a development server with hot-reloading:
    ```sh
    npm run dev
    ```
    This is useful for developing and testing the UI in a browser.

4.  **Build and run the Android app:**
    a. **Build the web assets:**
       ```sh
       npm run build
       ```
       This command will create a `dist` folder with the compiled web assets.

    b. **Sync the web assets with the Android project:**
       ```sh
       npx capacitor sync android
       ```
       This command copies the web assets into the native Android project. It may also ask you to install the Android platform if it's the first time.

    c. **Open the Android project in Android Studio:**
       ```sh
       npx capacitor open android
       ```
       This will open the `android` directory of your project in Android Studio.

    d. **Run the app:**
       From Android Studio, you can run the application on an Android emulator or a connected physical device by clicking the "Run" button.

## Building for Production

To create a production build of the application, follow the standard Android app release process in Android Studio to generate a signed APK or App Bundle. Make sure you have run `npm run build` before building the native app to ensure the latest web code is included.
