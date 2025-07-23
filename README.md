# QR Scanner Validator

## How to use
1. Clone the repository: `git clone https://github.com/donnyandrian/qr-validator.git`
2. Install dependencies: `bun install`
3. Start the server: `bun run dev`
   - You can forward the port using "VS Code Port Forwarding" or another method to access the app from anywhere, not just localhost.
4. Open the app in your browser: `http://localhost:3000`
5. Authenticate with a registered token.
    - Before generating tokens, set the encryption key in the `.env` file. For example:
      ```env
      # IMPORTANT: This key MUST be 32 characters (256 bits) long.
      # You can generate a new one using: openssl rand -base64 32
      # Replace `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` with your actual key.
      ENCRYPTION_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
      ```
    - To generate tokens, run: `bun run encrypt-user.ts`
    - Copy the tokens from the console output to the `authorized-users.json` file.
    - If the `authorized-users.json` file doesn't exist, create it in the root directory. For example:
      ```json
      [
        "d8a7...:...",
        "e1b9...:...",
        "f5c3...:..."
      ]
      ```
6. Use the **Scanner** tab to scan and validate a QR code.
    - The app will scan continuously. To stop, press the "Stop Scanner" button or refresh the page.
    - The scanner will pause during validation and resume once complete.
    - Validated QR codes are added to the history and will not be scanned again.
    - If you make a mistake, simply delete the entry from the history and scan again.
7. Use the **History** tab to view the validation history.
    - All history entries are stored and persisted in the `history.json` file in the root directory.
8. You can duplicate the browser tab (e.g., one for scanning and one for history), and it will work as expected. Refresh the page if needed.

## Tech Stack
- Next.js
- React
- TypeScript
- Tailwind CSS
- Socket.IO
- Node.js
- Bun
- Tanstack Query

## Notes
- Feel free to use a different package manager. While not officially tested, it should work. If you encounter any package-manager-related issues, please try to resolve them on your own 🗿.