import * as vscode from 'vscode';

// Constants for timeout values
const EDITOR_SETTLE_DELAY = 100;
const WORKSPACE_LOAD_DELAY = 500;

// Centralized logging system
class SmartPanelLogger {
    private outputChannel: vscode.OutputChannel;

    constructor() {
        this.outputChannel = vscode.window.createOutputChannel('Smart Panel');
    }

    private formatMessage(level: string, message: string): string {
        const timestamp = new Date().toLocaleTimeString();
        return `[${timestamp}] [${level}] ${message}`;
    }

    info(message: string) {
        const formatted = this.formatMessage('INFO', message);
        this.outputChannel.appendLine(formatted);
    }

    debug(message: string) {
        const formatted = this.formatMessage('DEBUG', message);
        this.outputChannel.appendLine(formatted);
    }

    error(message: string, error?: any) {
        const formatted = this.formatMessage('ERROR', message);
        if (error) {
            this.outputChannel.appendLine(`${formatted}: ${error}`);
        } else {
            this.outputChannel.appendLine(formatted);
        }
    }

    warn(message: string) {
        const formatted = this.formatMessage('WARN', message);
        this.outputChannel.appendLine(formatted);
    }

    show() {
        this.outputChannel.show(true);
    }

    dispose() {
        this.outputChannel.dispose();
    }
}

// Extension state management
type PanelState = 'hidden' | 'normal' | 'maximized';
let currentPanelState: PanelState = 'normal';
let isOperationInProgress = false;
let debounceTimer: NodeJS.Timeout | undefined;
let logger: SmartPanelLogger;

export function activate(context: vscode.ExtensionContext) {
    // Initialize logger
    logger = new SmartPanelLogger();
    logger.info('Smart Panel extension is now active!');

    // State management functions
    const updatePanelState = (newState: PanelState, reason: string) => {
        const oldState = currentPanelState;
        currentPanelState = newState;
        logger.debug(`State changed from ${oldState} → ${newState} (${reason})`);
    };

    // Enhanced error handling for VS Code commands with state tracking
    const executeCommand = async (command: string, errorMessage: string, expectedState?: PanelState): Promise<boolean> => {
        if (isOperationInProgress) {
            logger.debug('Operation already in progress, skipping');
            return false;
        }
        
        isOperationInProgress = true;
        try {
            await vscode.commands.executeCommand(command);
            logger.debug(`Successfully executed command: ${command}`);
            
            // Update state based on the command executed
            if (expectedState) {
                updatePanelState(expectedState, `after ${command}`);
            }
            
            return true;
        } catch (error) {
            logger.error(errorMessage, error);
            vscode.window.showWarningMessage(`Smart Panel: ${errorMessage}`);
            return false;
        } finally {
            // Release the lock after a short delay to prevent immediate re-triggering
            setTimeout(() => {
                isOperationInProgress = false;
                logger.debug('Operation lock released');
            }, 150);
        }
    };


    // Debounced handler to prevent rapid firing
    const debouncedHandleChange = () => {
        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }
        
        // Get debounce delay from user configuration
        const config = vscode.workspace.getConfiguration('smartPanel');
        const delay = config.get('debounceDelay', 50);
        
        debounceTimer = setTimeout(() => {
            handleEditorOrTabChange();
        }, delay);
    };

    // Centralized handler for state changes from various VS Code events
    const handleEditorOrTabChange = async () => {
        // Skip if operation is in progress to prevent loops
        if (isOperationInProgress) {
            logger.debug('Skipping handler - operation in progress');
            return;
        }

        const config = vscode.workspace.getConfiguration('smartPanel');
        const enableAutoMaximize = config.get('enableAutoMaximize', true);
        const editorOpenBehavior = config.get<'normal' | 'hidden'>('editorOpenBehavior', 'normal');

        if (!enableAutoMaximize) {
            logger.info('Auto-maximize disabled');
            return;
        }

        // Simple tab detection - just count all tabs
        const totalTabs = vscode.window.tabGroups.all.reduce((sum, g) => sum + g.tabs.length, 0);
        const hasContent = totalTabs > 0;

        // Enhanced debug logging with state information
        logger.debug(`totalTabs=${totalTabs}, hasContent=${hasContent}, currentState=${currentPanelState}, operationInProgress=${isOperationInProgress}`);

        // Determine target state based on content and user preferences
        let targetState: PanelState;
        if (!hasContent) {
            targetState = 'maximized';
        } else {
            targetState = editorOpenBehavior === 'hidden' ? 'hidden' : 'normal';
        }

        logger.debug(`Target state: ${targetState}, Current state: ${currentPanelState}`);

        // Only execute commands if state change is needed
        if (currentPanelState !== targetState) {
            logger.info(`State change required: ${currentPanelState} → ${targetState}`);
            
            if (targetState === 'maximized') {
                // Target: Maximized panel
                if (currentPanelState === 'hidden') {
                    // Hidden → Maximized: Use single command (VS Code handles show + maximize)
                    const success = await executeCommand('workbench.action.toggleMaximizedPanel', 'Failed to maximize panel from hidden', 'maximized');
                } else if (currentPanelState === 'normal') {
                    // Normal → Maximized: Just maximize
                    const success = await executeCommand('workbench.action.toggleMaximizedPanel', 'Failed to maximize panel', 'maximized');
                }
            } else if (targetState === 'hidden') {
                // Target: Hidden panel
                if (currentPanelState !== 'hidden') {
                    const success = await executeCommand('workbench.action.closePanel', 'Failed to close panel', 'hidden');
                }
            } else if (targetState === 'normal') {
                // Target: Normal panel
                if (currentPanelState === 'hidden') {
                    // Hidden → Normal: Show panel
                    const success = await executeCommand('workbench.action.togglePanel', 'Failed to show panel', 'normal');
                } else if (currentPanelState === 'maximized') {
                    // Maximized → Normal: Restore panel
                    const success = await executeCommand('workbench.action.toggleMaximizedPanel', 'Failed to restore panel', 'normal');
                }
            }
        } else {
            logger.debug(`No action needed - already in target state: ${targetState}`);
        }
    };

    // Monitor tab changes - this is the main event we care about
    const tabsChangeDisposable = vscode.window.tabGroups.onDidChangeTabs(() => {
        debouncedHandleChange();
    });

    // Add commands for manual control using state-aware logic
    const maximizePanelCommand = vscode.commands.registerCommand('smartPanel.maximizePanel', async () => {
        logger.info(`Manual maximize requested, current state: ${currentPanelState}`);
        
        if (currentPanelState === 'maximized') {
            vscode.window.showInformationMessage('Smart Panel: Panel is already maximized');
            return;
        }
        
        if (currentPanelState === 'hidden') {
            // Hidden → Maximized: Use single command (VS Code handles show + maximize)
            const success = await executeCommand('workbench.action.toggleMaximizedPanel', 'Failed to manually maximize panel from hidden', 'maximized');
            if (success) {
                vscode.window.showInformationMessage('Smart Panel: Panel maximized');
            }
        } else if (currentPanelState === 'normal') {
            // Normal → Maximized: Just maximize
            const success = await executeCommand('workbench.action.toggleMaximizedPanel', 'Failed to manually maximize panel', 'maximized');
            if (success) {
                vscode.window.showInformationMessage('Smart Panel: Panel maximized');
            }
        }
    });

    const restorePanelCommand = vscode.commands.registerCommand('smartPanel.restorePanel', async () => {
        logger.info(`Manual restore requested, current state: ${currentPanelState}`);
        
        if (currentPanelState === 'normal') {
            vscode.window.showInformationMessage('Smart Panel: Panel is already in normal size');
            return;
        }
        
        if (currentPanelState === 'hidden') {
            // Hidden → Normal: Show panel
            const success = await executeCommand('workbench.action.togglePanel', 'Failed to show panel', 'normal');
            if (success) {
                vscode.window.showInformationMessage('Smart Panel: Panel restored to normal size');
            }
        } else if (currentPanelState === 'maximized') {
            // Maximized → Normal: Restore panel
            const success = await executeCommand('workbench.action.toggleMaximizedPanel', 'Failed to manually restore panel', 'normal');
            if (success) {
                vscode.window.showInformationMessage('Smart Panel: Panel restored to normal size');
            }
        }
    });

    const toggleAutoCommand = vscode.commands.registerCommand('smartPanel.toggleAutoMaximize', () => {
        const config = vscode.workspace.getConfiguration('smartPanel');
        const currentValue = config.get('enableAutoMaximize', true);
        config.update('enableAutoMaximize', !currentValue, vscode.ConfigurationTarget.Global);
        
        const status = !currentValue ? 'enabled' : 'disabled';
        vscode.window.showInformationMessage(`Smart Panel: Auto-maximize ${status}`);
    });

    // Register all disposables
    context.subscriptions.push(
        tabsChangeDisposable,
        maximizePanelCommand,
        restorePanelCommand,
        toggleAutoCommand,
        logger
    );

    // Initialize state on activation with debouncing
    setTimeout(() => {
        logger.info('Initializing extension state');
        debouncedHandleChange();
    }, WORKSPACE_LOAD_DELAY); // Delay to ensure workspace is fully loaded
}

export function deactivate() {
    if (logger) {
        logger.info('Smart Panel extension is now inactive');
        logger.dispose();
    }
    
    // Clean up timers
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    
    // Reset state
    isOperationInProgress = false;
    currentPanelState = 'normal';
}
