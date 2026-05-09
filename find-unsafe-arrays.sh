#!/bin/bash

# Find unsafe array operations in React components
# Patterns like: data?.map, (data || []).filter, etc. WITHOUT safety checks

PAGES_DIR="/Users/asans/Desktop/4Project/Asset-Manager/artifacts/proptech/src/pages"

echo "=== Searching for unsafe array operations ==="
echo ""

# Pattern 1: (variable || []).method() - might fail if variable is not array
echo "Pattern 1: (variable || []).method() usage:"
grep -rn "(\w\+ || \[\])\.\(map\|filter\|reduce\|find\|some\|every\)" "$PAGES_DIR" --include="*.tsx" 2>/dev/null | head -20

echo ""
echo "Pattern 2: variable?.map() without Array.isArray check:"
grep -rn "\w\+\?\.map(" "$PAGES_DIR" --include="*.tsx" 2>/dev/null | grep -v "Array.isArray" | head -20

echo ""
echo "Pattern 3: Direct .map without safety:"
find "$PAGES_DIR" -name "*.tsx" -exec sh -c '
  file="$1"
  # Check if file has useQuery or useList hooks
  if grep -q "useQuery\|useList" "$file" 2>/dev/null; then
    # Check if it has array operations without Array.isArray
    if grep -q "\.map\|\.filter\|\.reduce" "$file" 2>/dev/null; then
      # Check if Array.isArray is missing
      if ! grep -q "Array.isArray" "$file" 2>/dev/null; then
        echo "⚠️  $file"
      fi
    fi
  fi
' sh {} \;

echo ""
echo "=== Search complete ==="
