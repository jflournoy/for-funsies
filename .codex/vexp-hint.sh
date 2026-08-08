#!/bin/bash
# vexp-hint: event-driven orientation hint (UserPromptSubmit). Fails open.
VEXP_BIN="/home/jflournoy/.vscode/extensions/vexp.vexp-vscode-2.5.3-linux-x64/binaries/vexp-core-linux-x64/vexp-core"
[ -x "$VEXP_BIN" ] || exit 0
"$VEXP_BIN" prompt-hint 2>/dev/null
exit 0
