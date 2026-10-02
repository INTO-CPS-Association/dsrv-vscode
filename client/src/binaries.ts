import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

/**
 * Locating the two executables the extension needs.
 * 
 * Resolution order, for both binaries:
 * 
 *  1. the user's setting, if set
 *  2. the copy bundled with this extension, if this build has one
 *  3. the bare command name, left to PATH
 * 
 * A setting may name a file, a directory to search, or a bare command name.
 */

export type BinaryName = "dsrv-lsp" | "trustworthiness_checker";

const SETTING: Record<BinaryName, string> = {
    "dsrv-lsp": "lspPath",
    "trustworthiness_checker": "binaryPath",
};

export interface Resolution {
    /** Command or absolute path to execute. */
    command: string;
    /** Where it came from. Used to word failures usefully. */
    source: "setting" | "bundled" | "path";
    /**
     * True if the file was found and is executable, false if it was looked for
     * and is not there, undefined for a bare command name left to PATH, which
     * cannot be checked cheaply and reliably across platforms.
     */
    exists?: boolean;
}

let extensionUri: vscode.Uri | undefined;

/** Call once from activate(), before resolving anything. */
export function initBinaries(context: vscode.ExtensionContext): void {
    extensionUri = context.extensionUri;
    ensureBundledExecutable("dsrv-lsp");
    ensureBundledExecutable("trustworthiness_checker");
}

export function resolveBinary(name: BinaryName): Resolution {
    const configured = vscode.workspace
        .getConfiguration("DSRV")
        .get<string>(SETTING[name])
        ?.trim();

    if (configured) {
        return { ...fromSetting(configured, name), source: "setting" };
    }

    const bundled = bundledPath(name);
    if (bundled && isExecutable(bundled)) {
        return { command: bundled, source: "bundled", exists: true };
    }

    return { command: executableName(name), source: "path" };
}

/** The setting the user would edit for this binary, e.g. "DSRV.lspPath" */
export function settingId(name: BinaryName): string {
    return `DSRV.${SETTING[name]}`;
}

export async function updateSetting(
    name: BinaryName,
    value: string,
): Promise<void> {
    await vscode.workspace
        .getConfiguration("DSRV")
        .update(SETTING[name], value, vscode.ConfigurationTarget.Workspace);
}

function fromSetting(
    configured: string,
    name: BinaryName,
): Omit<Resolution, "source"> {
    if (!looksLikePath(configured)) {
        // A bare command name. Leave it to PATH.
        return { command: configured };
    }

    const absolute = toAbsolute(configured);

    if (isDirectory(absolute)) {
        // The user pointed at a folder rather than a file. Look inside it,
        // including the usual cargo output locations.
        const found = searchDirectory(absolute, name);
        return found
            ? { command: found, exists: true }
            : { command: absolute, exists: false };
    }

    return { command: absolute, exists: isExecutable(absolute) };
}

function looksLikePath(value: string): boolean {
    return (
        path.isAbsolute(value) ||
        value.startsWith("./") ||
        value.startsWith("../") ||
        value.includes("/") ||
        value.includes("\\")
    );
}

function toAbsolute(value: string): string {
    const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    return root ? path.resolve(root, value) : path.resolve(value);
}

function searchDirectory(dir: string, name: BinaryName): string | undefined {
    const exe = executableName(name);
    return [
        path.join(dir, exe),
        path.join(dir, "target", "release", exe),
        path.join(dir, "target", "debug", exe),
    ].find(isExecutable);
}

function executableName(name: BinaryName): string {
    return process.platform === "win32" ? `${name}.exe` : name;
}

function bundledPath(name: BinaryName): string | undefined {
    if (!extensionUri) {
        return undefined;
    }
    return vscode.Uri.joinPath(extensionUri, "bin", executableName(name)).fsPath;
}

/**
 * A VSIX is a zip archive, and the execute bit does not reliably survive it.
 * Restore it on activation so a bundled binary is runnable.
 */
function ensureBundledExecutable(name: BinaryName): void {
    const candidate = bundledPath(name);
    if (!candidate) {
        return;
    }
    try {
        if (fs.statSync(candidate).isFile()) {
            fs.chmodSync(candidate, 0o755);
        }
    } catch {
        // This build does not bundle the binary. Nothing to do.
    }
}

function isDirectory(p: string): boolean {
    try {
        return fs.statSync(p).isDirectory();
    } catch {
        return false;
    }
}

function isExecutable(p: string): boolean {
    try {
        if (!fs.statSync(p).isFile()) {
            return false;
        }
        fs.accessSync(p, fs.constants.X_OK);
        return true;
    } catch {
        return false;
    }
}