#!/bin/sh

# 優先載入 nvm 預設版本，避免 Git hook 在非互動 shell 誤用系統 Node。
if [ -n "$NVM_DIR" ] && [ -s "/opt/homebrew/opt/nvm/nvm.sh" ]; then
  . "/opt/homebrew/opt/nvm/nvm.sh" --no-use
  nvm use --silent default >/dev/null 2>&1 || true
elif [ -s "$HOME/.nvm/nvm.sh" ]; then
  . "$HOME/.nvm/nvm.sh" --no-use
  nvm use --silent default >/dev/null 2>&1 || true
elif [ -s "/opt/homebrew/opt/nvm/nvm.sh" ]; then
  export NVM_DIR="$HOME/.nvm"
  . "/opt/homebrew/opt/nvm/nvm.sh" --no-use
  nvm use --silent default >/dev/null 2>&1 || true
fi
