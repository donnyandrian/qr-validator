# QR Scanner Validator

## How to use:
1. Start the server: `bun run dev`
2. Open the app in your browser: `http://localhost:3000`
    - You can forward the port to VS Code Port Forwarding or any other method, so you can access the app from anywhere, without limited to localhost. 
3. Authenticate using registered tokens.
    - Before generating tokens, ensure you have to set the encryption key in the `.env` file. For example:
    ``` env
    # IMPORTANT: This key MUST be 32 characters (256 bits) long.
    # You can generate a new one using: openssl rand -base64 32
    # Replace `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` with your actual key.
    ENCRYPTION_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
    ```
    - To generate tokens, run `bun run encrypt-user.ts`
    - Copy the tokens from the console output to `authorized-users.json`.
    - If the `authorized-users.json` file is not present, create it in the root directory. For example:
    ``` json
    [
    "d8a7...:...",
    "e1b9...:...",
    "f5c3...:..."
    ]
    ```
4. Use "Scanner" tab to scan a QR code and validate it.
    - It will try to scan infinitely. To stop scanning, press the "Stop Scanner" button or refresh the page.
    - While validating, the scanner will be paused. It will resume when the validation is done.
    - Once a QR code is validated, it will be added to the history and will not be scanned again.
    - If there is a mistake, just delete the entry from the history and try again.
5. Use "History" tab to view the validation history.
    - All history entries are stored in the `history.json` file in the root directory, which is persisted to disk.
6. You can try to duplicate the tab, like one tab for scanning and one tab for history. It will work as expected. Refresh the page if needed.

## Tech stack:
- Next.js
- React
- Typescript
- TailwindCSS
- Socket.IO
- Node.js
- Bun
- Tanstack Query
