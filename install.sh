#!/bin/bash

# VSCode Smart Panel Extension Installer
# Automates the build and installation process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 VSCode Smart Panel Extension Installer${NC}"
echo "=============================================="

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

# Check if command exists
check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "$1 is not installed or not in PATH"
        return 1
    fi
    return 0
}

# Environment checks
print_info "Checking environment..."

# Check Node.js
if check_command "node"; then
    NODE_VERSION=$(node --version)
    print_status "Node.js found: $NODE_VERSION"
else
    print_error "Node.js is required but not installed. Please install Node.js first."
    exit 1
fi

# Check npm
if check_command "npm"; then
    NPM_VERSION=$(npm --version)
    print_status "npm found: $NPM_VERSION"
else
    print_error "npm is required but not installed."
    exit 1
fi

# Check VSCode
if check_command "code"; then
    print_status "VSCode CLI found"
else
    print_warning "VSCode CLI not found. Please make sure VSCode is installed and 'code' command is available."
    echo "You can install VSCode CLI by opening VSCode and running: Command Palette > Shell Command: Install 'code' command in PATH"
fi

# Check vsce (VSCode Extension Manager)
if ! check_command "vsce"; then
    print_warning "vsce (Visual Studio Code Extension Manager) not found."
    echo -n "Would you like to install vsce? (y/N): "
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        print_info "Installing vsce..."
        npm install -g @vscode/vsce
        if check_command "vsce"; then
            print_status "vsce installed successfully"
        else
            print_error "Failed to install vsce"
            exit 1
        fi
    else
        print_info "Continuing without vsce (development mode only)"
    fi
fi

echo ""
print_info "Building extension..."

# Install dependencies
if [ ! -d "node_modules" ]; then
    print_info "Installing npm dependencies..."
    npm install
    print_status "Dependencies installed"
else
    print_status "Dependencies already installed"
fi

# Compile TypeScript
print_info "Compiling TypeScript..."
npm run compile
print_status "TypeScript compilation completed"

# Check if compilation was successful
if [ ! -f "out/extension.js" ]; then
    print_error "Compilation failed - extension.js not found"
    exit 1
fi

echo ""
echo "Choose installation method:"
echo "1) 📦 Package and install as VSIX (recommended for regular use)"
echo "2) 🔧 Development mode (test in Extension Development Host)"
echo "3) 🔗 Symlink to extensions directory (for active development)"
echo ""
echo -n "Enter your choice (1-3): "
read -r choice

case $choice in
    1)
        print_info "Creating VSIX package..."
        
        if check_command "vsce"; then
            # Remove existing VSIX files
            rm -f *.vsix
            
            # Create VSIX package
            vsce package
            
            # Find the generated VSIX file
            VSIX_FILE=$(ls *.vsix | head -n1)
            
            if [ -n "$VSIX_FILE" ]; then
                print_status "VSIX package created: $VSIX_FILE"
                
                # Install the extension
                print_info "Installing extension to VSCode..."
                code --install-extension "$VSIX_FILE"
                print_status "Extension installed successfully!"
                
                echo ""
                print_status "Installation complete! 🎉"
                echo ""
                print_warning "Please restart VSCode to activate the extension."
                echo ""
                print_info "To test the extension:"
                echo "1. Close all editor tabs"
                echo "2. The bottom panel should automatically maximize"
                echo "3. Open a new file and the panel should restore to normal size"
                echo ""
                print_info "Available commands in Command Palette (Cmd/Ctrl+Shift+P):"
                echo "- Smart Panel: Maximize Panel"
                echo "- Smart Panel: Restore Panel"
                echo "- Smart Panel: Toggle Auto-Maximize"
                
            else
                print_error "VSIX package not found after creation"
                exit 1
            fi
        else
            print_error "vsce is required for VSIX packaging but not available"
            exit 1
        fi
        ;;
    
    2)
        print_info "Setting up development mode..."
        print_status "Extension is ready for development testing!"
        echo ""
        print_info "To test the extension:"
        echo "1. Open this project in VSCode: code ."
        echo "2. Press F5 or use 'Run Extension' debug configuration"
        echo "3. A new Extension Development Host window will open"
        echo "4. Test the extension functionality in the new window"
        echo ""
        print_info "For continuous development:"
        echo "Run 'npm run watch' to automatically recompile on changes"
        ;;
    
    3)
        print_info "Creating symlink installation..."
        
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
        
        if [ ! -d "$VSCODE_EXT_DIR" ]; then
            print_error "VSCode extensions directory not found: $VSCODE_EXT_DIR"
            exit 1
        fi
        
        EXT_NAME="neowang.vscode-smart-panel-0.0.1"
        SYMLINK_PATH="$VSCODE_EXT_DIR/$EXT_NAME"
        
        # Remove existing symlink or directory
        if [ -L "$SYMLINK_PATH" ] || [ -d "$SYMLINK_PATH" ]; then
            print_info "Removing existing extension..."
            rm -rf "$SYMLINK_PATH"
        fi
        
        # Create symlink
        print_info "Creating symlink to extensions directory..."
        ln -s "$(pwd)" "$SYMLINK_PATH"
        
        print_status "Symlink created: $SYMLINK_PATH"
        print_status "Extension installed in development mode!"
        echo ""
        print_warning "Please restart VSCode to activate the extension."
        echo ""
        print_info "This installation method allows you to:"
        echo "- Make changes to the code and see them after VSCode restart"
        echo "- Use 'npm run watch' for continuous compilation"
        echo "- Debug directly in your main VSCode instance"
        ;;
    
    *)
        print_error "Invalid choice. Please run the script again and choose 1, 2, or 3."
        exit 1
        ;;
esac

echo ""
print_info "Extension settings can be found in VSCode settings:"
echo "- Smart Panel: Enable Auto Maximize"
echo "- Smart Panel: Auto Hide When Editor Opens"
echo ""
print_status "Setup completed successfully! 🎉"