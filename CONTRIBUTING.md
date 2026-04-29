# Developer Build and Run Guide
If you want to contribute to this project, the recommended workflow is to fork the repository and clone your fork locally. This allows you to make changes and submit pull requests.

## Prerequisites
The project is built using Rust and TypeScript. You will need the following tools to build and run the extension:
* Latest stable Rust toolchain
* Cargo
* Node.js and npm

### System Requirements
This project currently only works in **Linux environments**.
#### Supported:
* Linux
* WSL (Windows Subsystem for Linux) *(recommended for Windows users)*


#### Not Supported:
* Native Windows
* macOS

This limitation is due to dependencies from the *Robosapiens Trustworthiness Checker*.


## Quick Start

```bash
# Clone your fork
git clone <your-fork-url>
cd <project-directory>

# Install dependencies
npm install

# Build the project (debug mode recommended for development)
npm run build-debug

# Open in VS Code and press F5 to run the extension
```

## Recommended VS Code Extensions
* Rust Analyzer (`rust-lang.rust-analyzer`)
* ESLint (`dbaeumer.vscode-eslint`)
* Prettier (`esbenp.prettier-vscode`)
* Remote - WSL (`ms-vscode-remote.remote-wsl`) *(if using WSL)*


## 2. Setup the Development Environment

### Rust Setup

1. Install Rust (latest stable) from the official site:
   [https://rust-lang.org](https://rust-lang.org)
2. Install Cargo, which is the Rust package manager, by following the instructions on the [Cargo website](https://doc.rust-lang.org/cargo/getting-started/installation.html)

3. Verify installation:
```bash
rustc --version
cargo --version
```

4. Install required system dependencies (Debian/Ubuntu):

```bash
sudo apt update
sudo apt install build-essential cmake pkg-config libssl-dev
```

> If you're using another Linux distro, install equivalent packages via your package manager.

---

### Node.js and npm Setup

1. Install Node.js (LTS recommended):
   [https://nodejs.org](https://nodejs.org)

2. Verify installation:
```bash
node -v
npm -v
```

---

### TypeScript Setup

1. Install TypeScript globally:

```bash
npm install -g typescript
```

2. Verify installation:

```bash
tsc --version
```

3. Install project dependencies:

```bash
npm install
```

---

## Project Structure

* **Rust** -> Backend/native components compiled with Cargo
* **TypeScript** -> VS Code extension frontend
* The extension uses compiled Rust binaries at runtime


## 3. Building and Running the Extension

The project includes scripts in `package.json` for building and development.

### Running Scripts

Use either:

```bash
npm run <script-name>
```

Or run scripts directly from the **NPM Scripts** section in VS Code under the **Explorer** tab.

---

### Important Scripts

* `build` ->Production build (Rust + TypeScript)
* `build-debug` -> Development build (recommended)
* `build-rust` / `build-rust-debug` -> Rust only
* `build-base` -> TypeScript only
* `watch` -> Rebuild TypeScript on changes
* `test:ts` -> Run TypeScript tests
* `test:rust` -> Run Rust tests

---

### First-Time Setup

Run:

```bash
npm run build-debug
```

This will generate:

* `dist/` → Compiled TypeScript (JavaScript output)
* `target/debug` or `target/release` → Compiled Rust binaries

---

### Running the Extension

1. Open the project in VS Code
2. Open `extension.ts`
3. Press **F5**
4. Select **"VS Code Extension Development"**

This launches a new VS Code window with the extension loaded.

---

## 4. Testing

Run tests using:

```bash
npm run test:ts
npm run test:rust
```
This will generate:
* `.vscode-test` → Test environment for TypeScript tests

> Make sure the typescript project is built before running tests. The rust tests will automatically build the Rust code if needed.

---

## 5. Troubleshooting

### Build fails (OpenSSL errors)

```bash
sudo apt install libssl-dev
```

---

### Node version issues

Use Node Version Manager:

```bash
nvm install --lts
```

---

### Extension won’t start

* Ensure you ran:

```bash
npm run build-debug
```

* Check that the `dist/` folder exists

---

### Rust build issues

Try cleaning and rebuilding:

```bash
cargo clean
npm run build-debug
```

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

```

