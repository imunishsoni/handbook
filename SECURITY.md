# Security Policy

Handbook is a free, open-source code and text editor. As an open-source project built for developers, we treat security, privacy, and user safety as fundamental priorities. We actively welcome contributions, bug reports, and security audits from the global open-source community.

This policy outlines our threat model, vulnerability reporting workflow, safe harbor commitments, and secure development standards for contributors.

---

## Supported Versions

Security updates and critical patches are actively provided for the following releases:

| Version | Supported          | Release Channel |
| :---    | :---:              | :---            |
| **2.x** | :white_check_mark: | Current (Active Swift Native) |
| 1.x     | :x:                | Deprecated (Legacy Electron)  |

We recommend all users and contributors stay on the latest version of Handbook (`v2.x`).

---

## Scope & Threat Model

Handbook is a desktop application combining a native Swift core (AppKit & WKWebView) with a modern Monaco-based editor interface. Our primary security boundaries include:

### In-Scope Areas
- **Native IPC Bridge (`bridge.js` ↔ `NativeBridge` in Swift)**: Validation of commands, parameters, and payloads passed across the `WKScriptMessageHandler` interface.
- **File System Operations & Path Traversal**: Safe resolution of project roots, files, and symlinks, preventing directory traversal attacks or unauthorized file writes outside targeted folders.
- **Command-Line Interface (`handbook <path>`)**: Sanitization of CLI inputs and file paths passed on startup or via IPC.
- **Renderer & Content Sanitization**: Preventing cross-site scripting (XSS), arbitrary code execution, or DOM injection within the editor canvas or markdown previews.
- **Supply Chain & Dependencies**: Vulnerabilities in build scripts, npm packages, or bundled dependencies.

### Out-of-Scope Areas
- Attacks requiring pre-existing physical access, root/superuser compromise, or malware already executing with full privileges on the host system.
- Social engineering against project maintainers or users.
- Vulnerabilities in outdated, unsupported versions (`< 2.0`).

---

## Reporting a Vulnerability

We practice **Coordinated Vulnerability Disclosure (CVD)**. If you discover a security issue or potential vulnerability, please report it responsibly so we can resolve it before public release:

### 1. Preferred Method: GitHub Private Security Advisory
Submit your report confidentially through GitHub:
👉 **[Open a Security Advisory Report](https://github.com/imunishsoni/handbook/security/advisories/new)**

*This is the most secure and fastest method, allowing encrypted tracking and collaborative drafting of patches in a private workspace.*

### 2. Alternative Method: Direct Maintainer Contact
If you cannot use GitHub Security Advisories, contact the project maintainer directly:
- **Maintainer**: Munish Soni
- **GitHub Profile**: [@imunishsoni](https://github.com/imunishsoni)

### What to Include in Your Report
To help us triage and resolve the issue quickly, please include:
- A clear description of the vulnerability and its potential impact.
- Step-by-step reproduction instructions or a minimal Proof of Concept (PoC).
- Affected version(s) of Handbook and macOS environment details.
- Any suggested remediations or patches, if available.

---

## Our Security Response Commitment

We treat all security reports with urgency and respect for the researcher's time:

1. **Initial Response**: Within **24–48 hours**, acknowledging receipt of your report.
2. **Triage & Assessment**: Within **5 business days**, validating the issue, assigning a CVSS severity score, and defining an action plan.
3. **Collaborative Remediation**: We will invite you to collaborate on the fix in a private GitHub security advisory branch if you wish to contribute the patch.
4. **Coordinated Disclosure**: Once a fix is verified, we will release a patched update (e.g. patch release), publish a GitHub Security Advisory, credit you publicly, and request a CVE identifier if applicable.

---

## Safe Harbor Policy

We believe in supporting and protecting security researchers and open-source contributors who act in good faith:

- If you conduct security research and report vulnerabilities in accordance with this policy, we consider your activities **authorized**.
- We will **not** initiate or pursue legal action against you.
- We will work cooperatively with you to understand, reproduce, and resolve the issue in a timely manner.
- If an issue is reported by a third party, we will confirm that your actions complied with this policy.

---

## Security Guidelines for Code Contributors

When contributing code to Handbook, please keep these security best practices in mind:

1. **Native Bridge Validation**: Never trust incoming data from the renderer layer blindly. Ensure all paths and arguments in `src/native/main.swift` are sanitized, type-checked, and standardized using `URL(fileURLWithPath:).standardized`.
2. **Minimal Privileges**: Maintain the principle of least privilege. Do not enable unnecessary WebKit features, unsafe URL protocols, or disable sandbox restrictions without documented justification.
3. **Dependency Vigilance**: Avoid adding unnecessary external packages. Run `npm audit` before submitting dependencies and verify that lockfiles remain pinned.
4. **Atomic Disk Operations**: Preserve atomic file writes (`URL.write(to:options: .atomic)`) to protect user data from corruption during sudden power loss or crashes.
5. **Memory Safety**: Leverage Swift's native Automatic Reference Counting (ARC) and memory safety guarantees; avoid `UnsafePointer` or raw C memory manipulation unless strictly necessary and thoroughly audited.

---

## Contributor Recognition & Hall of Fame

Every security researcher or contributor who helps identify or resolve a vulnerability in Handbook will be publicly credited in:
- The release notes of the corresponding release.
- The project's [CHANGELOG.md](CHANGELOG.md).
- The official GitHub Security Advisory.

Thank you for contributing to the security, integrity, and safety of the Handbook open-source ecosystem!
