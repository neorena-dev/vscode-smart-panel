#!/bin/bash

# VSCode Smart Panel Extension Uninstaller
# Removes the extension from VSCode

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🗑️  VSCode Smart Panel Extension Uninstaller${NC}"
echo "================================================"

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if VSCode CLI is available
if ! command -v code &> /dev/null; then
    print_warning "VSCode CLI not found. Some uninstall methods may not work."
    echo "You can manually uninstall from VSCode Extensions panel."
fi

echo ""
echo "Choose uninstall method:"
echo "1) 🏪 Uninstall from VSCode (if installed via VSIX)"
echo "2) 🔗 Remove symlink (if installed via symlink method)"
echo "3) 🧹 Clean all (try both methods)"
echo ""
echo -n "Enter your choice (1-3): "
read -r choice

case $choice in
    1)
        print_info "Attempting to uninstall extension from VSCode..."
        
        if command -v code &> /dev/null; then
            # Try to uninstall by extension ID
            if code --uninstall-extension neowang.vscode-smart-panel; then
                print_status "Extension uninstalled from VSCode"
            else
                print_warning "Could not uninstall extension automatically"
                echo ""
                print_info "Manual uninstall instructions:"
                echo "1. Open VSCode"
                echo "2. Go to Extensions panel (Cmd/Ctrl+Shift+X)"
                echo "3. Search for 'Smart Panel'"
                echo "4. Click the gear icon and select 'Uninstall'"
            fi
        else
            print_error "VSCode CLI not available. Please uninstall manually from VSCode Extensions panel."
        fi
        ;;
    
    2)
        print_info "Removing symlink installation..."
        
        # Get VSCode extensions directory
        if [[ "$OSTYPE" == "darwin"* ]]; then
            VSCODE_EXT_DIR="$HOME/.vscode/extensions"
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            VSCODE_EXT_DIR="$HOME/.vscode/extensions"
        elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
            VSCODE_EXT_DIR="$APPDATA/Code/User/extensions"
        else
            print_error "Unsupported operating system"
            exit 1
        fi
        
        EXT_NAME="neowang.vscode-smart-panel-0.0.1"
        SYMLINK_PATH="$VSCODE_EXT_DIR/$EXT_NAME"
        
        if [ -L "$SYMLINK_PATH" ]; then
            print_info "Removing symlink: $SYMLINK_PATH"
            rm "$SYMLINK_PATH"
            print_status "Symlink removed successfully"
        elif [ -d "$SYMLINK_PATH" ]; then
            print_warning "Found directory (not symlink) at: $SYMLINK_PATH"
            echo -n "Remove this directory? (y/N): "
            read -r response
            if [[ "$response" =~ ^[Yy]$ ]]; then
                rm -rf "$SYMLINK_PATH"
                print_status "Directory removed"
            else
                print_info "Directory left intact"
            fi
        else
            print_warning "No symlink found at: $SYMLINK_PATH"
        fi
        ;;
    
    3)
        print_info "Attempting complete cleanup..."
        
        # Try VSCode uninstall first
        if command -v code &> /dev/null; then
            print_info "Trying to uninstall from VSCode..."
            code --uninstall-extension neowang.vscode-smart-panel || true
        fi
        
        # Remove symlink
        if [[ "$OSTYPE" == "darwin"* ]]; then
            VSCODE_EXT_DIR="$HOME/.vscode/extensions"
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            VSCODE_EXT_DIR="$HOME/.vscode/extensions"
        elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
            VSCODE_EXT_DIR="$APPDATA/Code/User/extensions"
        fi
        
        EXT_NAME="neowang.vscode-smart-panel-0.0.1"
        SYMLINK_PATH="$VSCODE_EXT_DIR/$EXT_NAME"
        
        if [ -L "$SYMLINK_PATH" ] || [ -d "$SYMLINK_PATH" ]; then
            print_info "Removing from extensions directory: $SYMLINK_PATH"
            rm -rf "$SYMLINK_PATH"
            print_status "Extension removed from extensions directory"
        fi
        
        print_status "Cleanup completed"
        ;;
    
    *)
        print_error "Invalid choice. Please run the script again and choose 1, 2, or 3."
        exit 1
        ;;
esac

echo ""
print_warning "Please restart VSCode to complete the uninstall process."
echo ""
print_info "Optional cleanup:"
echo "- Remove VSIX files: rm *.vsix"
echo "- Clean build output: rm -rf out node_modules"
echo ""
print_status "Uninstall completed! 🎉"